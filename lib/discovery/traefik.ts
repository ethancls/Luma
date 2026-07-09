import type { DiscoveredService } from './index';

export async function discoverTraefik(config: { url: string }): Promise<DiscoveredService[]> {
  const baseUrl = config.url.replace(/\/+$/, '');
  const apiUrl = `${baseUrl}/api/http/routers`;

  let data: unknown;
  try {
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) {
      console.error(`Traefik API returned ${res.status} from ${apiUrl}`);
      return [];
    }
    data = await res.json();
  } catch (err) {
    console.error(`Failed to fetch Traefik routers from ${apiUrl}:`, err);
    return [];
  }

  if (!Array.isArray(data)) {
    // Traefik v2 returns an array, v3 may return an object keyed by router name
    const entries = typeof data === 'object' && data !== null
      ? Object.entries(data as Record<string, unknown>)
      : [];
    if (entries.length === 0) return [];

    return entries.map(([key, router]) => parseTraefikRouter(key, router as TraefikRouter));
  }

  return (data as TraefikRouter[]).map((r) => parseTraefikRouter(r.name ?? r.service ?? 'unknown', r));
}

interface TraefikRouter {
  name?: string;
  service?: string;
  rule?: string;
  entryPoints?: string[];
  tls?: { certResolver?: string; options?: string; domains?: Array<{ main: string }> };
  [key: string]: unknown;
}

function parseTraefikRouter(name: string, router: TraefikRouter): DiscoveredService {
  const host = extractHost(router.rule);
  const tags: string[] = [];
  const entryPoints = router.entryPoints ?? [];

  if (entryPoints.includes('websecure') || entryPoints.includes('https') || router.tls) {
    tags.push('tls');
  }
  if (entryPoints.length > 0) {
    tags.push(...entryPoints.map((ep: string) => `entry:${ep}`));
  }

  const url = host ? `https://${host}` : undefined;
  const port = entryPoints.includes('web') || entryPoints.includes('http') ? 80
    : entryPoints.includes('websecure') || entryPoints.includes('https') ? 443
    : undefined;

  return { name, url, port, tags, source: 'traefik' };
}

function extractHost(rule?: string): string | undefined {
  if (!rule) return undefined;
  // Match Host(`example.com`) or Host(`example.com`, `www.example.com`)
  const match = rule.match(/Host\(`([^`]+)`/);
  return match?.[1];
}
