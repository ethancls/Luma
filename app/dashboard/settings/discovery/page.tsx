"use client";

import { useState, useCallback, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Gear, Globe, Scan } from '@phosphor-icons/react';
import { toastSuccess, toastError } from '@/lib/toast-utils';

interface SourceState {
  type: 'traefik' | 'docker' | 'scan';
  label: string;
  description: string;
  icon: React.ReactNode;
  lastSync: string | null;
  syncing: boolean;
  result: { found: number; new: number } | null;
}

const iconMap: Record<string, React.ReactNode> = {
  traefik: <Gear className="size-6" />,
  docker: <Scan className="size-6" />,
  scan: <Globe className="size-6" />,
};

export default function DiscoverySettingsPage() {
  const [sources, setSources] = useState<SourceState[]>([
    {
      type: 'traefik',
      label: 'Traefik',
      description: 'Discover services from a Traefik reverse proxy API endpoint.',
      icon: iconMap.traefik,
      lastSync: null,
      syncing: false,
      result: null,
    },
    {
      type: 'docker',
      label: 'Docker',
      description: 'Discover containers and stacks from a Docker Engine.',
      icon: iconMap.docker,
      lastSync: null,
      syncing: false,
      result: null,
    },
    {
      type: 'scan',
      label: 'Network Scan',
      description: 'Discover services by scanning a network range.',
      icon: iconMap.scan,
      lastSync: null,
      syncing: false,
      result: null,
    },
  ]);

  const defaultConfigs: Record<string, Record<string, unknown>> = {
    traefik: { url: 'http://localhost:8080' },
    docker: { host: 'unix:///var/run/docker.sock' },
    scan: { range: '192.168.1.1-254', ports: [80, 443, 3000, 8080, 8443] },
  };

  const handleSync = useCallback(async (type: string) => {
    setSources(prev => prev.map(s => s.type === type ? { ...s, syncing: true } : s));
    try {
      const res = await fetch(`/api/discovery/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultConfigs[type] || {}),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Sync failed');
      setSources(prev => prev.map(s =>
        s.type === type
          ? { ...s, syncing: false, lastSync: new Date().toISOString(), result: json.data }
          : s
      ));
      toastSuccess('Discovery complete', `${json.data.new} new services found.`);
    } catch (err) {
      setSources(prev => prev.map(s => s.type === type ? { ...s, syncing: false } : s));
      toastError('Discovery failed', err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Discovery Sources"
        description="Auto-discover services from your infrastructure"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sources.map((source) => (
          <div
            key={source.type}
            className="flex flex-col gap-4 rounded-xl border bg-card p-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  {source.icon}
                </span>
                <div>
                  <h3 className="font-semibold">{source.label}</h3>
                  <p className="text-xs text-muted-foreground">{source.type}</p>
                </div>
              </div>
              {source.result && (
                <Badge variant="success" size="sm">
                  {source.result.new} new
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground">{source.description}</p>

            <Separator />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Last sync</span>
              <span>
                {source.lastSync
                  ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(source.lastSync))
                  : 'Never'}
              </span>
            </div>

            <Button
              size="sm"
              variant="outline"
              loading={source.syncing}
              onClick={() => handleSync(source.type)}
            >
              Sync Now
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
