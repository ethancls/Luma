"use client";

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShareNetwork, Cube, Broadcast } from '@phosphor-icons/react';
import { toastSuccess, toastError } from '@/lib/toast-utils';

const defaultConfigs: Record<string, Record<string, unknown>> = {
  traefik: { url: 'http://localhost:8080' },
  docker: { host: 'unix:///var/run/docker.sock' },
  scan: { range: '192.168.1.1-254', ports: [80, 443, 3000, 8080, 8443] },
};

const sources = [
  { type: 'traefik', label: 'Traefik', desc: 'Reverse proxy API', icon: ShareNetwork },
  { type: 'docker', label: 'Docker', desc: 'Container labels', icon: Cube },
  { type: 'scan', label: 'Network Scan', desc: 'TCP port scan', icon: Broadcast },
] as const;

interface ScanState {
  syncing: boolean;
  progress: number;
  logs: string[];
  result: { found: number; new: number; updated: number } | null;
  error: string | null;
}

export default function DiscoverySettingsPage() {
  const [states, setStates] = useState<Record<string, ScanState>>({});

  const handleSync = useCallback(async (type: string) => {
    setStates(prev => ({
      ...prev,
      [type]: { syncing: true, progress: 0, logs: [], result: null, error: null },
    }));

    const log = (msg: string) => {
      const time = new Date().toLocaleTimeString();
      setStates(prev => {
        const s = prev[type] || { syncing: false, progress: 0, logs: [], result: null, error: null };
        return { ...prev, [type]: { ...s, logs: [...s.logs, `[${time}] ${msg}`] } };
      });
    };
    const setProgress = (p: number) => {
      setStates(prev => {
        const s = prev[type];
        if (!s?.syncing) return prev;
        return { ...prev, [type]: { ...s, progress: p } };
      });
    };

    log('Connecting...');
    setProgress(15);

    try {
      const res = await fetch(`/api/discovery/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultConfigs[type] || {}),
      });

      setProgress(80);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Sync failed');

      setProgress(100);
      log(`Done — ${json.data.found} services, ${json.data.new} new, ${json.data.updated} updated`);

      setStates(prev => ({
        ...prev,
        [type]: { syncing: false, progress: 100, logs: prev[type]?.logs || [], result: json.data, error: null },
      }));
      toastSuccess(`${sourceLabel(type)} synced`, `${json.data.new} new services found`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      log(`Failed: ${msg}`);
      setStates(prev => ({
        ...prev,
        [type]: { syncing: false, progress: 0, logs: prev[type]?.logs || [], result: null, error: msg },
      }));
      toastError('Sync failed', msg);
    }
  }, []);

  function sourceLabel(type: string) {
    return sources.find(s => s.type === type)?.label || type;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Discovery</h1>
        <p className="mt-1 text-sm text-muted-foreground">Auto-discover services from your infrastructure</p>
      </div>

      <div className="max-w-xl space-y-4">
        {sources.map((source) => {
          const state = states[source.type];
          const syncing = state?.syncing;
          const progress = state?.progress ?? 0;
          const result = state?.result;
          const logs = state?.logs;
          const error = state?.error;

          return (
            <div key={source.type} className="rounded-xl border bg-card">
              {/* Header row */}
              <div className="flex items-center gap-4 p-4">
                <source.icon className="size-6 shrink-0 text-muted-foreground" />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{source.label}</p>
                  <p className="text-xs text-muted-foreground">{source.desc}</p>
                </div>

                <div className="flex items-center gap-3">
                  {result && !syncing && (
                    <span className="text-xs text-muted-foreground">
                      {result.found} found &middot; {result.new} new
                    </span>
                  )}
                  {error && !syncing && (
                    <span className="text-xs text-red-500">Failed</span>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    loading={syncing}
                    onClick={() => handleSync(source.type)}
                  >
                    Sync
                  </Button>
                </div>
              </div>

              {/* Progress */}
              {syncing && (
                <div className="px-4 pb-1">
                  <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                      style={{ width: `${Math.max(progress, 4)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Logs */}
              {(logs && logs.length > 0) && (
                <div className="border-t bg-muted/20 px-4 py-3 font-mono text-[11px] leading-relaxed text-muted-foreground max-h-40 overflow-y-auto rounded-b-xl">
                  {logs.map((line, j) => (
                    <div key={j}>{line}</div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
