"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DesktopTower, CheckCircle, XCircle, Play } from '@phosphor-icons/react';
import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardPanel } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Warning, CloudSlashIcon } from '@phosphor-icons/react';

interface DashboardData {
  totalMachines: number;
  onlineCount: number;
  offlineCount: number;
  activeSessions: number;
  recentSessions: Array<{
    id: string;
    connectionName: string;
    machineName: string;
    userId: string;
    startedAt: string;
    duration: number | null;
  }>;
}

function LoadingSkeleton() {
  return (
    <div className="flex h-full flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Overview of your machines and sessions</p>
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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to load dashboard');
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

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="flex h-full flex-col">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Overview of your machines and sessions</p>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><Warning className="size-6 text-foreground" /></EmptyMedia>
              <EmptyTitle>Failed to load dashboard</EmptyTitle>
              <EmptyDescription>{error}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent><Button onClick={fetchData}>Retry</Button></EmptyContent>
          </Empty>
        </div>
      </div>
    );
  }

  if (!data || data.totalMachines === 0) {
    return (
      <div className="flex h-full flex-col">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Overview of your machines and sessions</p>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><CloudSlashIcon className="size-6 text-foreground" /></EmptyMedia>
              <EmptyTitle>No machines yet</EmptyTitle>
              <EmptyDescription>Add your first machine to start managing remote access.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link href="/dashboard/machines"><Button>Add your first machine</Button></Link>
            </EmptyContent>
          </Empty>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Overview of your machines and sessions</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/dashboard/machines" className="block">
          <StatCard
            label="Total Machines"
            value={data.totalMachines}
            icon={<DesktopTower className="size-5" />}
            className="cursor-pointer transition-colors hover:border-primary/50"
          />
        </Link>
        <Link href="/dashboard/machines" className="block">
          <StatCard
            label="Online"
            value={data.onlineCount}
            icon={<CheckCircle className="size-5 text-green-500" />}
            className="cursor-pointer transition-colors hover:border-primary/50"
          />
        </Link>
        <Link href="/dashboard/machines" className="block">
          <StatCard
            label="Offline"
            value={data.offlineCount}
            icon={<XCircle className="size-5 text-red-500" />}
            className="cursor-pointer transition-colors hover:border-primary/50"
          />
        </Link>
        <StatCard
          label="Active Sessions"
          value={data.activeSessions}
          icon={<Play className="size-5" />}
        />
      </div>

      {data.recentSessions.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Recent Sessions</CardTitle></CardHeader>
          <CardPanel className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Connection</TableHead>
                  <TableHead>Machine</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentSessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.connectionName}</TableCell>
                    <TableCell>{s.machineName}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(s.startedAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {s.duration != null ? `${Math.round(s.duration / 60)}m` : 'Active'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardPanel>
        </Card>
      )}
    </div>
  );
}
