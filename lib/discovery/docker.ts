import type { DiscoveredService } from './index';

export async function discoverDocker(config: { socketPath?: string; host?: string }): Promise<DiscoveredService[]> {
  // Unix socket is not directly supported by Node.js fetch — requires a custom HTTP
  // agent (e.g. dockerode or undici with unix: transport). For now, we only support
  // remote Docker hosts via HTTP.
  if (config.socketPath) {
    // TODO: implement Unix socket discovery using a custom HTTP agent or dockerode.
    return [];
  }

  if (!config.host) {
    return [];
  }

  const baseUrl = config.host.replace(/\/+$/, '');
  const apiUrl = `${baseUrl}/containers/json?all=true`;

  let containers: DockerContainer[];
  try {
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) {
      console.error(`Docker API returned ${res.status} from ${apiUrl}`);
      return [];
    }
    containers = await res.json();
  } catch (err) {
    console.error('Failed to fetch Docker containers:', err);
    return [];
  }

  const found: DiscoveredService[] = [];

  for (const container of containers) {
    const labels = container.Labels ?? {};

    // Only discover containers explicitly opted-in with traefik.enable=true
    if (labels['traefik.enable'] !== 'true') continue;

    const name = extractServiceName(container, labels);
    const host = extractDockerHost(labels);
    const port = extractDockerPort(container);
    const tags: string[] = [];

    if (labels['traefik.tls'] === 'true' || labels['traefik.tls.certresolver']) {
      tags.push('tls');
    }
    if (container.State === 'running') {
      tags.push('running');
    }

    const url = host ? `https://${host}` : undefined;

    found.push({ name, url, port, tags, source: 'docker' });
  }

  return found;
}

interface DockerContainer {
  Id?: string;
  Names?: string[];
  State?: string;
  Ports?: Array<{ PublicPort?: number; PrivatePort?: number; Type?: string }>;
  Labels?: Record<string, string>;
}

function extractServiceName(container: DockerContainer, labels: Record<string, string>): string {
  // Prefer a Traefik service label, then the container name stripped of leading /
  const labelName = Object.keys(labels).find(
    (k) => k.match(/^traefik\.http\.routers\.[^.]+\.service$/)
  );
  if (labelName) {
    const svc = labels[labelName];
    if (svc) return svc;
  }

  const containerName = container.Names?.[0] ?? container.Id ?? 'unknown';
  return containerName.replace(/^\//, '');
}

function extractDockerHost(labels: Record<string, string>): string | undefined {
  // Look for traefik.http.routers.<name>.rule=Host(`example.com`)
  for (const [key, value] of Object.entries(labels)) {
    if (key.startsWith('traefik.http.routers.') && key.endsWith('.rule')) {
      const match = value.match(/Host\(`([^`]+)`/);
      if (match) return match[1];
    }
  }
  return undefined;
}

function extractDockerPort(container: DockerContainer): number | undefined {
  const ports = container.Ports ?? [];
  // Prefer the first public HTTP/HTTPS port
  for (const p of ports) {
    if (p.PublicPort && (p.PrivatePort === 80 || p.PrivatePort === 443 || p.PrivatePort === 8443)) {
      return p.PublicPort;
    }
  }
  return ports.find((p) => p.PublicPort)?.PublicPort;
}
