import * as net from 'node:net';
import type { DiscoveredService } from './index';

const DEFAULT_PORTS = [80, 443, 8080, 8443, 3000];
const CONCURRENCY = 50;

function parseRange(range: string): string[] {
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

async function httpProbe(ip: string, port: number): Promise<DiscoveredService | null> {
  const protocol = port === 443 || port === 8443 ? 'https' : 'http';
  const url = `${protocol}://${ip}:${port}`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(2000),
      redirect: 'follow',
    });

    let name = `${ip}:${port}`;
    const server = res.headers.get('server');
    if (server) name = server.split('/')[0].trim();

    const tags: string[] = [protocol];
    if (res.status >= 200 && res.status < 400) tags.push('responding');

    return { name, url, port, tags, source: 'scan' };
  } catch {
    return { name: `${ip}:${port}`, url, port, tags: [protocol], source: 'scan' };
  }
}

export async function discoverScan(config: { range: string; ports?: number[] }): Promise<DiscoveredService[]> {
  const hosts = parseRange(config.range);
  const ports = config.ports ?? DEFAULT_PORTS;
  const found: DiscoveredService[] = [];

  // Generate all host:port pairs
  const targets: { host: string; port: number }[] = [];
  for (const host of hosts) {
    for (const port of ports) {
      targets.push({ host, port });
    }
  }

  // Probe in parallel with concurrency limit
  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async ({ host, port }) => {
        const open = await tcpProbe(host, port, 800);
        if (!open) return null;
        return httpProbe(host, port);
      })
    );
    for (const r of results) {
      if (r) found.push(r);
    }
  }

  return found;
}
