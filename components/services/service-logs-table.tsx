"use client";

import { useState, useEffect, useCallback } from "react";
import { Scroll } from "@phosphor-icons/react";
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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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
import { Button } from "@/components/ui/button";
import type { LogEntry } from "@/lib/services/types";

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

function LevelBadge({ level }: { level: string }) {
  const variants: Record<string, "secondary" | "warning" | "error"> = {
    info: "secondary",
    warn: "warning",
    error: "error",
  };
  return (
    <Badge variant={variants[level] || "secondary"} size="sm">
      {level}
    </Badge>
  );
}

function SourceBadge({ source }: { source: string }) {
  return (
    <Badge variant="outline" size="sm">
      {source}
    </Badge>
  );
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

interface ServiceLogsTableProps {
  serviceId: string;
}

const LEVEL_OPTIONS = [
  { value: "all", label: "All" },
  { value: "info", label: "Info" },
  { value: "warn", label: "Warn" },
  { value: "error", label: "Error" },
];

export function ServiceLogsTable({ serviceId }: ServiceLogsTableProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [level, setLevel] = useState("all");
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (level !== "all") params.set("level", level);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const res = await fetch(
        `/api/services/${serviceId}/logs?${params.toString()}`,
      );
      if (!res.ok) throw new Error("Failed to fetch logs");
      const json = await res.json();
      setLogs(json.data.logs ?? []);
      setTotal(json.data.total ?? 0);
    } catch {
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [serviceId, page, level]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset page when level filter changes
  const handleLevelChange = useCallback((value: string | null) => {
    setLevel(value || "all");
    setPage(1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // ---- Loading ----
  if (loading) {
    return <LoadingTable rows={5} cols={4} />;
  }

  // ---- Data ----
  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Level:</span>
        <Select onValueChange={handleLevelChange} value={level}>
          <SelectTrigger className="w-[140px]">
            <SelectValue>
              {(value: string) => {
                return LEVEL_OPTIONS.find((o) => o.value === value)?.label ?? value;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {LEVEL_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <Button variant="ghost" size="sm" onClick={fetchLogs}>
          Refresh
        </Button>
      </div>

      {/* Empty state */}
      {logs.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Scroll className="size-6 text-foreground" />
            </EmptyMedia>
            <EmptyTitle>No logs found</EmptyTitle>
            <EmptyDescription>
              Log entries will appear here when events occur.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <Table variant="card">
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    <LevelBadge level={log.level} />
                  </TableCell>
                  <TableCell className="max-w-[400px] truncate text-sm">
                    {log.message}
                  </TableCell>
                  <TableCell>
                    <SourceBadge source={log.source} />
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
        </>
      )}
    </div>
  );
}
