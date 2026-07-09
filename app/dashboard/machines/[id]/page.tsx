"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PencilSimple, Trash, DesktopTower, ArrowClockwise } from "@phosphor-icons/react";
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

import { useMachineTypes } from "@/lib/use-machine-types";

function PingSparkline({ machineId }: { machineId: string }) {
  const [points, setPoints] = useState<number[]>([]);

  useEffect(() => {
    fetch(`/api/machines/${machineId}/logs?source=ping&limit=60`)
      .then((r) => r.json())
      .then((json) => {
        const logs = json.data?.logs ?? [];
        const latencies = logs
          .map((l: any) => (l.metadata && typeof l.metadata === "object" ? (l.metadata as any).latency : null))
          .filter((v: any): v is number => typeof v === "number")
          .reverse();
        setPoints(latencies);
      })
      .catch(() => {});
  }, [machineId]);

  if (points.length < 2) return null;

  const w = 300;
  const h = 40;
  const pad = 2;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const stepX = (w - pad * 2) / (points.length - 1);

  const line = points
    .map((v, i) => {
      const x = pad + i * stepX;
      const y = pad + h - pad * 2 - ((v - min) / range) * (h - pad * 4);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const area = `${line} L ${pad + (points.length - 1) * stepX} ${h - pad} L ${pad} ${h - pad} Z`;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>Latency (60s)</span>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-10 w-[300px]">
        <path d={area} fill="url(#pingGrad)" />
        <path d={line} fill="none" stroke="var(--color-primary,#3A88FE)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <defs>
          <linearGradient id="pingGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary,#3A88FE)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--color-primary,#3A88FE)" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

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
  const { config: typeConfig } = useMachineTypes();
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
          onClick={handlePing}
          disabled={pinging}
        >
          <ArrowClockwise className={`size-4 ${pinging ? "animate-spin" : ""}`} />
          {pinging ? "Pinging..." : "Ping"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setFormOpen(true)}
        >
          <PencilSimple className="size-4" />
          Edit
        </Button>

        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button variant="destructive-outline" size="sm">
                <Trash className="size-4" />
                Delete
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Machine</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{" "}
                <strong>{machine.name}</strong>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogClose
                render={
                  <Button variant="outline" size="sm">
                    Cancel
                  </Button>
                }
              />
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
          className={`inline-flex shrink-0 items-center rounded-sm px-2 py-px text-xs font-medium ${typeConfig[machine.type]?.className ?? ""}`}
        >
          {typeConfig[machine.type]?.label || machine.type}
        </span>
        <span className="text-sm text-muted-foreground">
          Last seen: {machine.lastSeen ? formatDate(machine.lastSeen) : "Never"}
        </span>
        {pingResult && (
          <span className={`text-sm font-medium ${pingResult.reachable ? "text-emerald-600" : "text-red-500"}`}>
            {pingResult.reachable ? `${pingResult.latency}ms` : "Unreachable"}
          </span>
        )}
      </div>

      {/* Latency sparkline */}
      <PingSparkline machineId={id} />

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
                className={`inline-flex shrink-0 items-center rounded-sm px-2 py-px text-xs font-medium ${typeConfig[machine.type]?.className ?? ""}`}
              >
                {typeConfig[machine.type]?.label || machine.type}
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
