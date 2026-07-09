"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PencilSimple, Trash, DesktopTower, Activity } from "@phosphor-icons/react";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { MachineForm } from "@/components/machines/machine-form";
import { Card, CardHeader, CardTitle, CardPanel } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogClose,
} from "@/components/ui/alert-dialog";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

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
      className={`inline-block size-2.5 shrink-0 rounded-full ${colors[status] || colors.unknown}`}
      title={status}
    />
  );
}

import { MACHINE_TYPE_CONFIG } from "@/lib/machine-types";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Never";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MachineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ reachable: boolean; latency: number } | null>(null);

  const fetchMachine = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/machines/${id}`);
      if (res.status === 404) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch machine");
      const json = await res.json();
      setMachine(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handlePing = useCallback(async () => {
    setPinging(true);
    setPingResult(null);
    try {
      const res = await fetch(`/api/machines/${id}/ping`, { method: "POST" });
      const json = await res.json();
      setPingResult(json.data);
      fetchMachine();
    } catch {
      setPingResult({ reachable: false, latency: 0 });
    } finally {
      setPinging(false);
    }
  }, [id, fetchMachine]);

  useEffect(() => {
    fetchMachine();
  }, [fetchMachine]);

  async function handleDelete() {
    await fetch(`/api/machines/${id}`, { method: "DELETE" });
    router.push("/dashboard/machines");
  }

  // ---- Loading ----
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardPanel>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          </CardPanel>
        </Card>
      </div>
    );
  }

  // ---- Not found ----
  if (notFound) {
    return (
      <div className="flex h-full items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <DesktopTower className="size-6 text-foreground" />
            </EmptyMedia>
            <EmptyTitle>Machine not found</EmptyTitle>
            <EmptyDescription>
              This machine doesn't exist or has been deleted.
            </EmptyDescription>
          </EmptyHeader>
          <Button onClick={() => router.push("/dashboard/machines")}>
            Back to machines
          </Button>
        </Empty>
      </div>
    );
  }

  // ---- Error ----
  if (error) return <ErrorState message={error} onRetry={fetchMachine} />;
  if (!machine) return null;

  // ---- Data ----
  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/machines"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Machines
      </Link>

      {/* Header */}
      <PageHeader title={machine.name}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFormOpen(true)}
        >
          <PencilSimple className="size-4" />
          Edit
        </Button>

        <AlertDialog>
          <AlertDialogTrigger>
            <Button variant="destructive-outline" size="sm">
              <Trash className="size-4" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Machine</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{" "}
                <strong>{machine.name}</strong>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogClose>
                <Button variant="outline" size="sm">
                  Cancel
                </Button>
              </AlertDialogClose>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  handleDelete();
                }}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageHeader>

      {/* Status + type row */}
      <div className="flex items-center gap-3">
        <StatusDot status={machine.status} />
        <span
          className={`inline-flex shrink-0 items-center rounded-sm px-2.5 py-0.5 text-sm font-medium ring-1 ring-inset ${MACHINE_TYPE_CONFIG[machine.type]?.className ?? ""}`}
        >
          {MACHINE_TYPE_CONFIG[machine.type]?.label || machine.type}
        </span>
        <span className="text-sm text-muted-foreground">
          Last seen: {machine.lastSeen ? formatDate(machine.lastSeen) : "Never"}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePing}
          disabled={pinging}
          className="gap-1.5"
        >
          <Activity className={`size-3.5 ${pinging ? "animate-spin" : ""}`} />
          {pinging ? "Pinging..." : pingResult ? `${pingResult.latency}ms` : "Ping"}
        </Button>
      </div>

      {/* Machine info card */}
      <Card>
        <CardHeader>
          <CardTitle>Machine Info</CardTitle>
        </CardHeader>
        <CardPanel>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Host</p>
              <p className="font-mono text-sm">{machine.host}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <span
                className={`inline-flex shrink-0 items-center rounded-sm px-2.5 py-0.5 text-sm font-medium ring-1 ring-inset ${MACHINE_TYPE_CONFIG[machine.type]?.className ?? ""}`}
              >
                {MACHINE_TYPE_CONFIG[machine.type]?.label || machine.type}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">CPU</p>
              <p className="text-sm">
                {machine.cpuCores != null
                  ? `${machine.cpuCores} cores`
                  : "\u2014"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">RAM</p>
              <p className="text-sm">
                {machine.ramGb != null ? `${machine.ramGb} GB` : "\u2014"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Disk</p>
              <p className="text-sm">
                {machine.diskGb != null ? `${machine.diskGb} GB` : "\u2014"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="text-sm">{formatDate(machine.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Updated</p>
              <p className="text-sm">{formatDate(machine.updatedAt)}</p>
            </div>
          </div>
        </CardPanel>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardPanel>
          {machine.notes ? (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {machine.notes}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground/50">No notes yet.</p>
          )}
        </CardPanel>
      </Card>

      {/* Services placeholder */}
      <Card>
        <CardPanel>
          <div className="flex flex-col items-center justify-center py-12">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <DesktopTower className="size-6 text-foreground" />
                </EmptyMedia>
                <EmptyTitle>No services linked</EmptyTitle>
                <EmptyDescription>
                  This machine doesn't have any services assigned to it yet.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        </CardPanel>
      </Card>

      {/* Form dialog */}
      <MachineForm
        open={formOpen}
        onOpenChange={setFormOpen}
        machine={machine}
        onSuccess={fetchMachine}
      />
    </div>
  );
}
