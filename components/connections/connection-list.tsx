"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardPanel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
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
import { ConnectionForm } from "./connection-form";
import { PencilSimple, Trash, Plug, Lightning } from "@phosphor-icons/react";
import { toastSuccess, toastError } from "@/lib/toast-utils";

interface Connection {
  id: string;
  machineId: string;
  name: string;
  protocol: string;
  host: string | null;
  port: number;
  username: string;
  credentialType: string;
  parameters: Record<string, unknown> | null;
  createdAt: string;
}

const PROTOCOL_BADGES: Record<string, string> = {
  ssh: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  rdp: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  vnc: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  telnet: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
};

interface ConnectionListProps {
  machineId: string;
  machineHost: string;
}

export function ConnectionList({ machineId, machineHost }: ConnectionListProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Connection | null>(null);

  const fetchConnections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/connections?machineId=${machineId}`);
      if (!res.ok) throw new Error("Failed to load connections");
      const json = await res.json();
      setConnections(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [machineId]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await fetch(`/api/connections/${id}`, { method: "DELETE" });
      toastSuccess("Connection deleted");
      fetchConnections();
    } catch {
      toastError("Failed", "Could not delete the connection");
    }
  }, [fetchConnections]);

  const handleConnect = useCallback((connectionId: string) => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/api/connect/${connectionId}/ws`;
    window.open(`/dashboard/machines/${machineId}/connect/${connectionId}`, "_blank");
  }, [machineId]);

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Connections</CardTitle></CardHeader>
        <CardPanel className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </CardPanel>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Connections</CardTitle>
            <Button variant="outline" size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
              Add
            </Button>
          </div>
        </CardHeader>

        {error ? (
          <CardPanel>
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={fetchConnections}>Retry</Button>
          </CardPanel>
        ) : connections.length === 0 ? (
          <CardPanel>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><Plug className="size-5 text-foreground" /></EmptyMedia>
                <EmptyTitle>No connections</EmptyTitle>
                <EmptyDescription>Add SSH, RDP, VNC, or Telnet connections to this machine.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardPanel>
        ) : (
          <CardPanel className="space-y-2 p-0">
            {connections.map((conn) => (
              <div key={conn.id} className="flex items-center gap-3 border-b px-6 py-3 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{conn.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {conn.host ?? machineHost}:{conn.port} · {conn.username}
                  </p>
                </div>

                <Badge variant="outline" className={`shrink-0 text-xs ${PROTOCOL_BADGES[conn.protocol] ?? ""}`}>
                  {conn.protocol.toUpperCase()}
                </Badge>

                <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={() => handleConnect(conn.id)}>
                  <Lightning className="size-3.5" />
                  Connect
                </Button>

                <Button variant="ghost" size="icon" className="shrink-0 size-8" onClick={() => { setEditing(conn); setFormOpen(true); }}>
                  <PencilSimple className="size-4" />
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger render={
                    <Button variant="ghost" size="icon" className="shrink-0 size-8 text-muted-foreground hover:text-destructive">
                      <Trash className="size-4" />
                    </Button>
                  } />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Connection</AlertDialogTitle>
                      <AlertDialogDescription>Delete <strong>{conn.name}</strong>? This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogClose render={<Button variant="outline" size="sm">Cancel</Button>} />
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(conn.id)}>Delete</Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </CardPanel>
        )}
      </Card>

      <ConnectionForm
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditing(null); }}
        machineId={machineId}
        machineHost={machineHost}
        connection={editing}
        onSuccess={fetchConnections}
      />
    </>
  );
}
