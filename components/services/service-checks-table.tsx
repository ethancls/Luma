"use client";

import { useState, useEffect, useCallback } from "react";
import { Heartbeat } from "@phosphor-icons/react";
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
import type { Check as CheckType } from "@/lib/services/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function StatusBadge({ statusCode }: { statusCode: number | null }) {
  if (statusCode == null) {
    return <Badge variant="secondary">Error</Badge>;
  }
  let variant: "success" | "warning" | "error" = "error";
  if (statusCode >= 200 && statusCode < 300) variant = "success";
  else if (statusCode >= 300 && statusCode < 400) variant = "warning";

  return <Badge variant={variant}>{statusCode}</Badge>;
}

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

interface ServiceChecksTableProps {
  serviceId: string;
}

export function ServiceChecksTable({ serviceId }: ServiceChecksTableProps) {
  const [checks, setChecks] = useState<CheckType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const fetchChecks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/services/${serviceId}/checks?page=${page}&limit=${limit}`,
      );
      if (!res.ok) throw new Error("Failed to fetch checks");
      const json = await res.json();
      setChecks(json.data.checks ?? []);
      setTotal(json.data.total ?? 0);
    } catch {
      setChecks([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [serviceId, page]);

  useEffect(() => {
    fetchChecks();
  }, [fetchChecks]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // ---- Loading ----
  if (loading) {
    return <LoadingTable rows={5} cols={5} />;
  }

  // ---- Empty ----
  if (checks.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Heartbeat className="size-6 text-foreground" />
          </EmptyMedia>
          <EmptyTitle>No checks yet</EmptyTitle>
          <EmptyDescription>
            Run a health check to see results here.
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
            <TableHead>Checked At</TableHead>
            <TableHead>Status Code</TableHead>
            <TableHead>Response (ms)</TableHead>
            <TableHead>TLS Days</TableHead>
            <TableHead>Error</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {checks.map((check) => (
            <TableRow key={check.id}>
              <TableCell className="text-xs">
                {formatDate(check.checkedAt)}
              </TableCell>
              <TableCell>
                <StatusBadge statusCode={check.statusCode} />
              </TableCell>
              <TableCell>
                {check.responseMs != null ? (
                  <span className="text-sm tabular-nums">{check.responseMs}</span>
                ) : (
                  <span className="text-muted-foreground/50">--</span>
                )}
              </TableCell>
              <TableCell>
                {check.tlsDaysRemaining != null ? (
                  <span className="text-sm tabular-nums">{check.tlsDaysRemaining}</span>
                ) : (
                  <span className="text-muted-foreground/50">--</span>
                )}
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                {check.error || (
                  <span className="text-muted-foreground/50">--</span>
                )}
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
                  if (page > 1) setPage(page - 1);
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
                    onClick={() => setPage(p)}
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
                  if (page < totalPages) setPage(page + 1);
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
