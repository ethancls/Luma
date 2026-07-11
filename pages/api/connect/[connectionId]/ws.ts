import type { NextApiRequest, NextApiResponse } from 'next';
import { WebSocketServer } from 'ws';
import { connect } from 'node:net';
import { getConnectionWithCredential } from '@/lib/connections';
import { getMachine } from '@/lib/machines';
import { env } from '@/lib/env';
import { auth } from '@/lib/auth';
import { buildGuacdHandshake } from '@/lib/connect/guacd-handshake';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { connectionId } = req.query;
  if (typeof connectionId !== 'string') {
    res.status(400).end();
    return;
  }

  // Auth
  const session = await auth.api.getSession({ headers: req.headers as any });
  if (!session) {
    res.status(401).end();
    return;
  }

  // Load connection
  const conn = await getConnectionWithCredential(connectionId);
  if (!conn) {
    res.status(404).end();
    return;
  }

  const machine = await getMachine(conn.machineId);
  const host = conn.host || machine?.host;
  if (!host) {
    res.status(400).end();
    return;
  }

  // Connect to guacd
  const guacdSocket = connect({ host: env.GUACD_HOST, port: env.GUACD_PORT });

  const handshakeTimeout = setTimeout(() => guacdSocket.destroy(), 10000);

  guacdSocket.once('connect', () => {
    clearTimeout(handshakeTimeout);
    const line = buildGuacdHandshake(conn.protocol, host, conn.port, conn.username, conn.credential);
    guacdSocket.write(line);
  });

  guacdSocket.once('error', () => {
    clearTimeout(handshakeTimeout);
    res.status(502).end();
  });

  // WebSocket upgrade
  const wss = new WebSocketServer({ noServer: true });

  // Cast: Pages Router uses Node.js HTTP server underneath, socket upgrade is supported
  const socket = (req as any).socket;
  const head = (req as any).head || Buffer.alloc(0);

  wss.handleUpgrade(req, socket, head, (ws) => {
    // Browser → guacd
    ws.on('message', (data) => {
      if (guacdSocket.writable) {
        const buf = typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data as ArrayBuffer);
        guacdSocket.write(buf);
      }
    });

    // guacd → browser
    guacdSocket.on('data', (data: Buffer) => {
      if (ws.readyState === ws.OPEN) ws.send(data);
    });

    // Cleanup
    ws.on('close', () => guacdSocket.destroy());
    guacdSocket.on('close', () => { if (ws.readyState === ws.OPEN) ws.close(); });
    ws.on('error', () => guacdSocket.destroy());
    guacdSocket.on('error', () => { if (ws.readyState === ws.OPEN) ws.close(); });
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
