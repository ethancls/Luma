"use client";

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Gear, Globe, Scan } from '@phosphor-icons/react';
import { toastSuccess, toastError } from '@/lib/toast-utils';
import { Separator } from '@/components/ui/separator';

const defaultConfigs: Record<string, Record<string, unknown>> = {
  traefik: { url: 'http://localhost:8080' },
  docker: { host: 'unix:///var/run/docker.sock' },
  scan: { range: '192.168.1.1-254', ports: [80, 443, 3000, 8080, 8443] },
};

const sources = [
  { type: 'traefik', label: 'Traefik', desc: 'Discover routers and services from a Traefik reverse proxy.', icon: Gear },
  { type: 'docker', label: 'Docker', desc: 'Discover containers with Traefik labels from a Docker host.', icon: Scan },
  { type: 'scan', label: 'Network Scan', desc: 'Scan a network range for open HTTP ports and services.', icon: Globe },
];

interface SyncState {
  syncing: boolean;
  progress: number;
  result: { found: number; new: number; updated: number } | null;
  error: string | null;
}

export default function DiscoverySettingsPage() {
  const [states, setStates] = useState<Record<string, SyncState>>({});

  const handleSync = useCallback(async (type: string) => {
    setStates(prev => ({ ...prev, [type]: { syncing: true, progress: 0, result: null, error: null } }));

    // Simulated progress while fetching
    const interval = setInterval(() => {
      setStates(prev => {
        const s = prev[type];
        if (!s?.syncing) return prev;
        return { ...prev, [type]: { ...s, progress: Math.min(s.progress + 15, 90) } };
      });
    }, 200);

    try {
      const res = await fetch(`/api/discovery/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultConfigs[type] || {}),
      });
      clearInterval(interval);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Sync failed');
      setStates(prev => ({
        ...prev,
        [type]: { syncing: false, progress: 100, result: json.data, error: null },
      }));
      toastSuccess('Discovery complete', `${json.data.new} new, ${json.data.updated} updated.`);
    } catch (err) {
      clearInterval(interval);
      setStates(prev => ({
        ...prev,
        [type]: { syncing: false, progress: 0, result: null, error: err instanceof Error ? err.message : 'Failed' },
      }));
      toastError('Discovery failed', err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Discovery</h1>
        <p className="mt-1 text-sm text-muted-foreground">Auto-discover services from your infrastructure</p>
      </div>

      <Separator className="my-6" />

      <div className="max-w-2xl">
        {sources.map((source, i) => {
          const state = states[source.type];
          const syncing = state?.syncing;
          const progress = state?.progress ?? 0;
          const result = state?.result;
          const error = state?.error;

          return (
            <div key={source.type}>
              <div className="flex items-center gap-4 py-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <source.icon className="size-5" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{source.label}</p>
                    {result && !syncing && (
                      <span className="text-xs text-muted-foreground">
                        {result.found} found · {result.new} new · {result.updated} updated
                      </span>
                    )}
                    {error && (
                      <span className="text-xs text-red-500">{error}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{source.desc}</p>

                  {syncing && (
                    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  loading={syncing}
                  onClick={() => handleSync(source.type)}
                >
                  Sync
                </Button>
              </div>
              {i < sources.length - 1 && <Separator />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
