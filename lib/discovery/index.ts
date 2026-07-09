import { db } from '@/lib/db';
import { discoverySources, services } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { discoverTraefik } from './traefik';
import { discoverDocker } from './docker';
import { discoverScan } from './scan';

export interface DiscoveredService {
  name: string;
  url?: string;
  port?: number;
  tags: string[];
  source: string;
}

export async function runDiscovery(
  type: 'traefik' | 'docker' | 'scan',
  config: Record<string, unknown>,
): Promise<{ found: number; new: number; updated: number; services: DiscoveredService[] }> {
  let found: DiscoveredService[];

  switch (type) {
    case 'traefik':
      found = await discoverTraefik(config as { url: string });
      break;
    case 'docker':
      found = await discoverDocker(config as { socketPath?: string; host?: string });
      break;
    case 'scan':
      found = await discoverScan(config as { range: string; ports?: number[] });
      break;
    default:
      throw new Error(`Unknown discovery type: ${type}`);
  }

  let newCount = 0;

  for (const svc of found) {
    const existing = await db.select().from(services).where(eq(services.name, svc.name)).limit(1);
    if (existing.length === 0) {
      await db.insert(services).values({
        id: uuid(),
        name: svc.name,
        url: svc.url,
        port: svc.port,
        tags: svc.tags,
      });
      newCount++;
    }
  }

  return {
    found: found.length,
    new: newCount,
    updated: found.length - newCount,
    services: found,
  };
}

// Source management

export async function getDiscoverySources() {
  return db.select().from(discoverySources).orderBy(desc(discoverySources.createdAt));
}

export async function createDiscoverySource(data: {
  type: 'traefik' | 'docker' | 'scan';
  config: Record<string, unknown>;
}) {
  const id = uuid();
  await db.insert(discoverySources).values({
    id,
    type: data.type,
    config: data.config,
    enabled: true,
  });
  const rows = await db.select().from(discoverySources).where(eq(discoverySources.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function deleteDiscoverySource(id: string) {
  await db.delete(discoverySources).where(eq(discoverySources.id, id));
}
