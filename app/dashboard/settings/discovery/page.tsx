"use client";

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Gear, Globe, Scan } from '@phosphor-icons/react';

// TODO: Replace with real data fetched from GET /api/discovery/sources
// when the discovery-source management API is available.
interface DiscoverySource {
  type: 'traefik' | 'docker' | 'network-scan';
  label: string;
  description: string;
  enabled: boolean;
  lastSyncAt: string | null;
}

const PLACEHOLDER_SOURCES: DiscoverySource[] = [
  {
    type: 'traefik',
    label: 'Traefik',
    description: 'Discover services from a Traefik reverse proxy API endpoint.',
    enabled: false,
    lastSyncAt: null,
  },
  {
    type: 'docker',
    label: 'Docker',
    description: 'Discover containers and stacks from a Docker Engine or Swarm.',
    enabled: false,
    lastSyncAt: null,
  },
  {
    type: 'network-scan',
    label: 'Network Scan',
    description: 'Discover services by scanning a network range or subnet.',
    enabled: false,
    lastSyncAt: null,
  },
];

const iconMap: Record<DiscoverySource['type'], React.ReactNode> = {
  traefik: <Gear className="size-6" />,
  docker: <Scan className="size-6" />,
  'network-scan': <Globe className="size-6" />,
};

function formatLastSync(value: string | null): string {
  if (!value) return 'Never synced';
  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return 'Invalid date';
  }
}

export default function DiscoverySettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Discovery Sources"
        description="Configure where Luma discovers services and machines"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PLACEHOLDER_SOURCES.map((source) => (
          <div
            key={source.type}
            className="rounded-xl border bg-card p-5 flex flex-col gap-4"
          >
            {/* Header row: icon + label + enabled badge */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  {iconMap[source.type]}
                </span>
                <div>
                  <h3 className="font-semibold">{source.label}</h3>
                  <p className="text-xs text-muted-foreground">{source.type}</p>
                </div>
              </div>
              <Badge variant={source.enabled ? 'success' : 'secondary'} size="sm">
                {source.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground">{source.description}</p>

            <Separator />

            {/* Last sync */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Last sync</span>
              <span>{formatLastSync(source.lastSyncAt)}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!source.enabled}
                className="flex-1"
              >
                Sync Now
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                Configure
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
