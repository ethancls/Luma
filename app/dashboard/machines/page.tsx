"use client";

import { useState, useEffect, useCallback, useRef, type ComponentProps } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Plus } from "@phosphor-icons/react";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { MachineTable } from "@/components/machines/machine-table";
import { MachineForm } from "@/components/machines/machine-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
  { value: "unknown", label: "Unknown" },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MachinesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [machines, setMachines] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<ComponentProps<typeof MachineForm>["machine"]>(null);

  const limit = 20;

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prevFiltersRef = useRef<string>("");

  // -----------------------------------------------------------------------
  // URL sync helper
  // -----------------------------------------------------------------------

  const updateUrl = useCallback(
    (params: Record<string, string>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(params)) {
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
      }
      router.replace(`${pathname}?${next.toString()}`);
    },
    [searchParams, router, pathname],
  );

  // -----------------------------------------------------------------------
  // Data fetching
  // -----------------------------------------------------------------------

  const fetchMachines = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const res = await fetch(`/api/machines?${params}`);
      if (!res.ok) throw new Error("Failed to fetch machines");
      const json = await res.json();
      setMachines(json.data.machines);
      setTotal(json.data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [status, search, page]);

  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  // -----------------------------------------------------------------------
  // Debounced search
  // -----------------------------------------------------------------------

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateUrl({ search: value, status, page: "" });
        setPage(1);
      }, 300);
    },
    [status, updateUrl],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // -----------------------------------------------------------------------
  // Filter handlers
  // -----------------------------------------------------------------------

  const handleStatusChange = useCallback(
    (value: string | null) => {
      const v = !value || value === "all" ? "" : value;
      setStatus(v);
      updateUrl({ status: v, search, page: "" });
      setPage(1);
    },
    [search, updateUrl],
  );

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <PageHeader
        title="Machines"
        description="Manage and monitor your homelab machines"
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select onValueChange={handleStatusChange} value={status || "all"}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          className="w-[220px]"
          placeholder="Search machines..."
          type="search"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />

        <div className="flex-1" />

        <Button
          onClick={() => {
            setEditingMachine(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Add Machine
        </Button>
      </div>

      {/* Content */}
      {error ? (
        <ErrorState message={error} onRetry={fetchMachines} />
      ) : (
        <MachineTable
          machines={machines}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onRowClick={(id) => router.push(`/dashboard/machines/${id}`)}
          loading={loading}
        />
      )}

      {/* Form dialog */}
      <MachineForm
        open={formOpen}
        onOpenChange={setFormOpen}
        machine={editingMachine}
        onSuccess={fetchMachines}
      />
    </div>
  );
}
