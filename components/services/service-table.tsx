"use client";

import type React from "react";
import { HardDrive } from "@phosphor-icons/react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { LoadingTable } from "@/components/shared/loading-table";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Service {
  id: string;
  name: string;
  url: string | null;
  port: number | null;
  description: string | null;
  status: "online" | "degraded" | "offline" | "unknown";
  categoryId: string | null;
  tags: string[];
  dockerComposeSnippet: string | null;
  notes: string | null;
  tlsExpiry: string | null;
  tlsIssuer: string | null;
  lastChecked: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ServiceTableProps {
  services: Service[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onRowClick: (id: string) => void;
  loading?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    online: "bg-emerald-400",
    degraded: "bg-amber-400",
    offline: "bg-red-400",
    unknown: "bg-muted-foreground/30",
  };
  return (
    <span
      className={`inline-block size-2 shrink-0 rounded-full ${colors[status] || colors.unknown}`}
      title={status}
    />
  );
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never";

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Never";

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function truncateUrl(url: string | null): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    const display = u.hostname + u.pathname;
    return display.length > 40 ? display.slice(0, 37) + "..." : display;
  } catch {
    return url.length > 40 ? url.slice(0, 37) + "..." : url;
  }
}

// ---------------------------------------------------------------------------
// Pagination helpers
// ---------------------------------------------------------------------------

function getVisiblePages(page: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [];

  pages.push(1);

  if (page > 3) {
    pages.push("ellipsis");
  }

  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (page < totalPages - 2) {
    pages.push("ellipsis");
  }

  pages.push(totalPages);

  return pages;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ServiceTable({
  services,
  total,
  page,
  limit,
  onPageChange,
  onRowClick,
  loading = false,
}: ServiceTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // ---- Loading ----
  if (loading) {
    return <LoadingTable rows={5} cols={5} />;
  }

  // ---- Empty ----
  if (services.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HardDrive className="size-6 text-foreground" />
          </EmptyMedia>
          <EmptyTitle>No services found</EmptyTitle>
          <EmptyDescription>
            Add your first service to start monitoring.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  // ---- Data ----
  return (
    <div className="space-y-4">
      <Table variant="card">
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">Status</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Last Check</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => (
            <TableRow
              key={service.id}
              className="cursor-pointer hover:bg-accent"
              onClick={() => onRowClick(service.id)}
            >
              <TableCell>
                <StatusDot status={service.status} />
              </TableCell>
              <TableCell>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {service.name}
                </span>
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-muted-foreground">
                {service.url ? (
                  <span title={service.url}>{truncateUrl(service.url)}</span>
                ) : (
                  <span className="text-muted-foreground/50">--</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {service.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} size="sm" variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                  {service.tags.length > 3 && (
                    <Badge size="sm" variant="outline">
                      +{service.tags.length - 3}
                    </Badge>
                  )}
                  {service.tags.length === 0 && (
                    <span className="text-muted-foreground/50 text-xs">--</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {formatRelativeTime(service.lastChecked)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => {
                  if (page > 1) onPageChange(page - 1);
                }}
                className={
                  page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                }
              />
            </PaginationItem>

            {getVisiblePages(page, totalPages).map((p, i) =>
              p === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${i}`}>
                  <span className="flex min-w-7 justify-center text-muted-foreground">
                    ...
                  </span>
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink
                    isActive={p === page}
                    onClick={() => onPageChange(p)}
                    className="cursor-pointer"
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() => {
                  if (page < totalPages) onPageChange(page + 1);
                }}
                className={
                  page >= totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
