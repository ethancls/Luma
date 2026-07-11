import { createServer } from 'node:http';
import { parse } from 'node:url';
import { WebSocketServer } from 'ws';
import { connect } from 'node:net';
import { getConnectionWithCredential } from './lib/connections';
import { getMachine } from './lib/machines';
import { env } from './lib/env';
import { auth } from './lib/auth';
import { buildGuacdHandshake } from './lib/connect/guacd-handshake';

const PORT = parseInt(process.env.WS_PORT || '3001', 10);

const server = createServer((_req, res) => {
  res.writeHead(404).end();
});

server.on('upgrade', (req, socket, head) => {
  const { pathname } = parse(req.url!, true);
  if (!pathname?.startsWith('/api/connect/')) {
    socket.destroy();
    return;
  }

  const connectionId = pathname.split('/')[3];
  if (!connectionId) { socket.destroy(); return; }

  // Auth via cookie
  const headers = new Headers();
  if (req.headers.cookie) headers.set('cookie', req.headers.cookie);

  auth.api.getSession({ headers }).then(async (session) => {
    if (!session) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    const conn = await getConnectionWithCredential(connectionId);
    if (!conn) {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      socket.destroy();
      return;
    }

    const machine = await getMachine(conn.machineId);
    const host = conn.host || machine?.host;
    if (!host) {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
      return;
    }

    const guacdSocket = connect({ host: env.GUACD_HOST, port: env.GUACD_PORT });
    const timeout = setTimeout(() => guacdSocket.destroy(), 10000);

    guacdSocket.once('connect', () => {
      clearTimeout(timeout);
      guacdSocket.write(buildGuacdHandshake(conn.protocol, host, conn.port, conn.username, conn.credential));
    });

    guacdSocket.once('error', () => {
      clearTimeout(timeout);
      socket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n');
      socket.destroy();
    });

    const wss = new WebSocketServer({ noServer: true });
    wss.handleUpgrade(req, socket, head, (ws) => {
      ws.on('message', (data) => {
        if (guacdSocket.writable) {
          guacdSocket.write(typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data as ArrayBuffer));
        }
      });
      guacdSocket.on('data', (data) => {
        if (ws.readyState === ws.OPEN) ws.send(data);
      });
      ws.on('close', () => guacdSocket.destroy());
      guacdSocket.on('close', () => { if (ws.readyState === ws.OPEN) ws.close(); });
      ws.on('error', () => guacdSocket.destroy());
      guacdSocket.on('error', () => { if (ws.readyState === ws.OPEN) ws.close(); });
    });
  }).catch(() => {
    socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
    socket.destroy();
  });
});

server.listen(PORT, () => {
  console.log(`WS tunnel ready on port ${PORT}`);
});
