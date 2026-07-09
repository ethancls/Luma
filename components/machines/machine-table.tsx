"use client";

import type React from "react";
import { DesktopTower } from "@phosphor-icons/react";
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

interface Machine {
  id: string;
  name: string;
  host: string;
  type: string;
  cpuCores: number | null;
  ramGb: number | null;
  diskGb: number | null;
  notes: string | null;
  status: "online" | "offline" | "unknown";
  lastSeen: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MachineTableProps {
  machines: Machine[];
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

import { MACHINE_TYPE_CONFIG } from "@/lib/machine-types";

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

export function MachineTable({
  machines,
  total,
  page,
  limit,
  onPageChange,
  onRowClick,
  loading = false,
}: MachineTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // ---- Loading ----
  if (loading) {
    return <LoadingTable rows={6} cols={6} />;
  }

  // ---- Empty ----
  if (machines.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <DesktopTower className="size-6 text-foreground" />
          </EmptyMedia>
          <EmptyTitle>No machines found</EmptyTitle>
          <EmptyDescription>
            Add your first machine to start monitoring.
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
            <TableHead>Host</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Services</TableHead>
            <TableHead>Last Seen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {machines.map((machine) => (
            <TableRow
              key={machine.id}
              className="cursor-pointer hover:bg-accent"
              onClick={() => onRowClick(machine.id)}
            >
              <TableCell>
                <StatusDot status={machine.status} />
              </TableCell>
              <TableCell>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {machine.name}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground font-mono text-sm">
                {machine.host}
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex shrink-0 items-center rounded-sm px-2.5 py-0.5 text-sm font-medium ring-1 ring-inset ${MACHINE_TYPE_CONFIG[machine.type]?.className ?? ""}`}
                >
                  {MACHINE_TYPE_CONFIG[machine.type]?.label || machine.type}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground/50">
                &mdash;
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatRelativeTime(machine.lastSeen)}
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
