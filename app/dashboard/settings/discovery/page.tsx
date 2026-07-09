"use client";

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShareNetwork, Cube, Broadcast } from '@phosphor-icons/react';
import { toastError } from '@/lib/toast-utils';

const defaultConfigs: Record<string, Record<string, unknown>> = {
  traefik: { url: 'http://localhost:8080' },
  docker: { host: 'unix:///var/run/docker.sock' },
  scan: { range: '192.168.1.1-254', ports: [80, 443, 3000, 8080, 8443] },
};

const sources = [
  { type: 'traefik', label: 'Traefik', desc: 'Discover routers and services from a Traefik reverse proxy API.', icon: ShareNetwork },
  { type: 'docker', label: 'Docker', desc: 'Discover containers with Traefik labels from a Docker host.', icon: Cube },
  { type: 'scan', label: 'Network Scan', desc: 'Scan a network range for open HTTP ports and services.', icon: Broadcast },
];

interface ScanState {
  syncing: boolean;
  progress: number;
  logs: string[];
  result: { found: number; new: number; updated: number } | null;
  error: string | null;
}

export default function DiscoverySettingsPage() {
  const [states, setStates] = useState<Record<string, ScanState>>({});
  const logsRef = useRef<Record<string, HTMLDivElement | null>>({});

  const addLog = useCallback((type: string, msg: string) => {
    setStates(prev => {
      const s = prev[type] || { syncing: false, progress: 0, logs: [], result: null, error: null };
      return { ...prev, [type]: { ...s, logs: [...s.logs, `[${new Date().toLocaleTimeString()}] ${msg}`] } };
    });
  }, []);

  const handleSync = useCallback(async (type: string) => {
    setStates(prev => ({
      ...prev,
      [type]: { syncing: true, progress: 0, logs: [], result: null, error: null },
    }));

    const log = (msg: string) => addLog(type, msg);
    const updateProgress = (p: number) => {
      setStates(prev => {
        const s = prev[type];
        if (!s?.syncing) return prev;
        return { ...prev, [type]: { ...s, progress: p } };
      });
    };

    log(`Starting ${type} discovery...`);
    updateProgress(10);

    // Progress simulation
    const steps = [
      { at: 20, msg: 'Connecting...' },
      { at: 40, msg: 'Fetching data...' },
      { at: 60, msg: 'Parsing response...' },
      { at: 80, msg: 'Comparing with existing services...' },
    ];
    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        const step = steps[currentStep++];
        updateProgress(step.at);
        log(step.msg);
      }
    }, 400);

    try {
      const res = await fetch(`/api/discovery/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultConfigs[type] || {}),
      });
      clearInterval(interval);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Sync failed');

      updateProgress(100);
      log(`Done. Found ${json.data.found} service(s) — ${json.data.new} new, ${json.data.updated} updated.`);

      setStates(prev => ({
        ...prev,
        [type]: {
          syncing: false,
          progress: 100,
          logs: prev[type]?.logs || [],
          result: json.data,
          error: null,
        },
      }));
    } catch (err) {
      clearInterval(interval);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      log(`Error: ${msg}`);
      setStates(prev => ({
        ...prev,
        [type]: {
          syncing: false,
          progress: 0,
          logs: prev[type]?.logs || [],
          result: null,
          error: msg,
        },
      }));
      toastError('Discovery failed', msg);
    }
  }, [addLog]);

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Discovery</h1>
        <p className="mt-1 text-sm text-muted-foreground">Auto-discover services from your infrastructure</p>
      </div>

      <Separator className="my-8" />

      <div className="max-w-2xl space-y-0">
        {sources.map((source, i) => {
          const state = states[source.type];
          const syncing = state?.syncing;
          const progress = state?.progress ?? 0;
          const result = state?.result;
          const logs = state?.logs ?? [];
          const error = state?.error;

          return (
            <div key={source.type}>
              <div className="flex items-start gap-5 py-5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-foreground">
                  <source.icon className="size-5.5" weight="duotone" />
                </span>

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <p className="text-base font-semibold">{source.label}</p>
                    <Button
                      size="xs"
                      variant="outline"
                      loading={syncing}
                      onClick={() => handleSync(source.type)}
                    >
                      {syncing ? 'Scanning' : 'Sync'}
                    </Button>
                    {!syncing && result && (
                      <span className="text-sm text-muted-foreground">
                        {result.found} found &middot; {result.new} new &middot; {result.updated} updated
                      </span>
                    )}
                    {!syncing && error && (
                      <span className="text-sm text-red-500">{error}</span>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">{source.desc}</p>

                  {/* Progress bar */}
                  {syncing && (
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${Math.max(progress, 5)}%` }}
                      />
                    </div>
                  )}

                  {/* Live logs */}
                  {logs.length > 0 && (
                    <div className="mt-3 rounded-lg border bg-muted/30 p-3 font-mono text-xs text-muted-foreground max-h-48 overflow-y-auto space-y-0.5">
                      {logs.map((line, j) => (
                        <div key={j}>{line}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {i < sources.length - 1 && <Separator />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
