import * as net from 'node:net';
import type { DiscoveredService } from './index';

const DEFAULT_PORTS = [80, 443, 8080, 8443, 3000];

function parseRange(range: string): string[] {
  // Supports CIDR ranges via simple last-octet expansion, e.g. "192.168.1.1-254"
  // Also supports single IPs.
  const trimmed = range.trim();

  // Single IP
  if (/^\d+\.\d+\.\d+\.\d+$/.test(trimmed)) {
    return [trimmed];
  }

  // Range: 192.168.1.1-254
  const rangeMatch = trimmed.match(/^(\d+\.\d+\.\d+)\.(\d+)-(\d+)$/);
  if (rangeMatch) {
    const prefix = rangeMatch[1];
    const start = parseInt(rangeMatch[2], 10);
    const end = parseInt(rangeMatch[3], 10);
    const hosts: string[] = [];
    for (let i = start; i <= end; i++) {
      hosts.push(`${prefix}.${i}`);
    }
    return hosts;
  }

  console.error(`Unsupported range format: ${range}`);
  return [];
}

function tcpProbe(ip: string, port: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const done = (open: boolean) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(open);
    };

    socket.setTimeout(timeoutMs);
    socket.on('connect', () => done(true));
    socket.on('timeout', () => done(false));
    socket.on('error', () => done(false));

    socket.connect(port, ip);
  });
}

async function httpProbe(ip: string, port: number): Promise<{ name: string; tags: string[] } | null> {
  const protocol = port === 443 || port === 8443 ? 'https' : 'http';
  const url = `${protocol}://${ip}:${port}`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(3000),
      redirect: 'follow',
    });

    // Try to extract a title or server header
    let name = `${ip}:${port}`;
    const server = res.headers.get('server');
    if (server) {
      name = `${server} (${ip}:${port})`;
    }

    const tags: string[] = [];
    tags.push(protocol);
    if (res.status >= 200 && res.status < 400) tags.push('responding');

    // Check for common service signatures
    const body = await res.text().catch(() => '');
    if (body.includes('Traefik')) tags.push('traefik');
    if (body.includes('Portainer')) tags.push('portainer');
    if (body.includes('Proxmox')) tags.push('proxmox');

    return { name, tags };
  } catch {
    // Port open but HTTP probe failed — still report something
    return { name: `${ip}:${port}`, tags: [protocol] };
  }
}

export async function discoverScan(config: { range: string; ports?: number[] }): Promise<DiscoveredService[]> {
  const hosts = parseRange(config.range);
  const ports = config.ports ?? DEFAULT_PORTS;
  const timeoutMs = 2000;
  const found: DiscoveredService[] = [];

  for (const host of hosts) {
    for (const port of ports) {
      const open = await tcpProbe(host, port, timeoutMs);
      if (!open) continue;

      const probe = await httpProbe(host, port);
      if (!probe) continue;

      found.push({
        name: probe.name,
        url: `${port === 443 || port === 8443 ? 'https' : 'http'}://${host}:${port}`,
        port,
        tags: probe.tags,
        source: 'scan',
      });
    }
  }

  return found;
}
