"use client";

import { useState, useEffect, useCallback } from 'react';
import { CloudSlashIcon, HardDrive, CheckCircle, XCircle, DesktopTower, Warning } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardPanel } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OfflineService {
  id: string;
  name: string;
  status: string;
  url: string | null;
}

interface TlsExpiringItem {
  id: string;
  name: string;
  url: string | null;
  tlsExpiry: string;
}

interface DashboardData {
  totalServices: number;
  onlineCount: number;
  offlineCount: number;
  totalMachines: number;
  offlineServices: OfflineService[];
  recentChecks: unknown[];
  recentLogs: unknown[];
  tlsExpiring: TlsExpiringItem[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDaysRemaining(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'offline'
      ? 'bg-red-500'
      : status === 'degraded'
        ? 'bg-yellow-500'
        : 'bg-gray-400';
  return <span className={`inline-block size-2 shrink-0 rounded-full ${color}`} />;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="flex h-full flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Overview of your homelab services</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 animate-pulse">
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="mt-4 h-8 w-12 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Overview of your homelab services</p>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Warning className="size-6 text-foreground" />
            </EmptyMedia>
            <EmptyTitle>Failed to load dashboard</EmptyTitle>
            <EmptyDescription>{message}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={onRetry}>Retry</Button>
          </EmptyContent>
        </Empty>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Request failed with status ${res.status}`);
      }
      const json = await res.json();
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---- Loading ------------------------------------------------------------------
  if (loading) return <LoadingSkeleton />;

  // ---- Error --------------------------------------------------------------------
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  // ---- Empty (no services) ------------------------------------------------------
  if (!data || data.totalServices === 0) {
    return (
      <div className="flex h-full flex-col">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Overview of your homelab services</p>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CloudSlashIcon className="size-6 text-foreground" />
              </EmptyMedia>
              <EmptyTitle>No services yet</EmptyTitle>
              <EmptyDescription>
                Add your first service to start monitoring your homelab.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => router.push('/dashboard/services')}>
                Add your first service
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      </div>
    );
  }

  // ---- Full dashboard -----------------------------------------------------------
  return (
    <div className="flex h-full flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Overview of your homelab services</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/dashboard/services" className="block">
          <StatCard
            label="Total Services"
            value={data.totalServices}
            icon={<HardDrive className="size-5" />}
            className="cursor-pointer transition-colors hover:border-primary/50"
          />
        </Link>
        <Link href="/dashboard/services" className="block">
          <StatCard
            label="Online"
            value={data.onlineCount}
            icon={<CheckCircle className="size-5 text-green-500" />}
            className="cursor-pointer transition-colors hover:border-primary/50"
          />
        </Link>
        <Link href="/dashboard/services" className="block">
          <StatCard
            label="Offline"
            value={data.offlineCount}
            icon={<XCircle className="size-5 text-red-500" />}
            className="cursor-pointer transition-colors hover:border-primary/50"
          />
        </Link>
        <div>
          <StatCard
            label="Machines"
            value={data.totalMachines}
            icon={<DesktopTower className="size-5" />}
          />
        </div>
      </div>

      {/* TLS expiring (only when items exist) */}
      {data.tlsExpiring.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>TLS Expiring Soon</CardTitle>
          </CardHeader>
          <CardPanel className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead className="text-right">Days Remaining</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.tlsExpiring.map((item) => {
                  const days = getDaysRemaining(item.tlsExpiry);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{formatDate(item.tlsExpiry)}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            days < 7 ? 'destructive' : days < 14 ? 'warning' : 'info'
                          }
                        >
                          {days}d
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardPanel>
        </Card>
      )}

      {/* Offline services (only when count > 0) */}
      {data.offlineCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Offline Services</CardTitle>
          </CardHeader>
          <CardPanel className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.offlineServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5">
                        <StatusDot status={service.status} />
                        <span className="text-xs text-muted-foreground capitalize">
                          {service.status}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          router.push(`/dashboard/services/${service.id}`)
                        }
                      >
                        Check
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardPanel>
        </Card>
      )}

      {/* Recent checks */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Checks</CardTitle>
        </CardHeader>
        <CardPanel>
          {data.recentChecks.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No recent checks</EmptyTitle>
                <EmptyDescription>
                  Health check results will appear here once services are monitored.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Response Time</TableHead>
                  <TableHead className="text-right">Checked At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* TODO: Populate when recentChecks has data */}
              </TableBody>
            </Table>
          )}
        </CardPanel>
      </Card>

      {/* Recent logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Logs</CardTitle>
        </CardHeader>
        <CardPanel>
          {data.recentLogs.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No recent logs</EmptyTitle>
                <EmptyDescription>
                  Service logs will appear here once events are recorded.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* TODO: Populate when recentLogs has data */}
              </TableBody>
            </Table>
          )}
        </CardPanel>
      </Card>
    </div>
  );
}
