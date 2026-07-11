import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import { WebSocketServer, WebSocket } from 'ws';
import { connect } from 'node:net';
import { parse } from 'node:url';
import { getConnectionWithCredential } from '@/lib/connections';
import { getMachine } from '@/lib/machines';
import { env } from '@/lib/env';
import { auth } from '@/lib/auth';

function extractConnectionId(pathname: string): string | null {
  const m = pathname.match(/^\/api\/connect\/([^/]+)\/ws/);
  return m?.[1] ?? null;
}

function headersFromCookies(req: IncomingMessage): Headers {
  const headers = new Headers();
  if (req.headers.cookie) headers.set('cookie', req.headers.cookie);
  return headers;
}

/**
 * Build the initial handshake line for guacd.
 *
 * The guacd connection protocol is a null-delimited string:
 *   protocol\0host\0port\0username\0password\0\0\0;
 *
 * Fields: protocol, host, port, username, password, domain, guacd-params...
 * Double \0\0 marks end of connection params + start of guacd params.
 * Final ; is the Guacamole instruction terminator.
 */
function buildGuacdHandshake(
  protocol: string,
  host: string,
  port: number,
  username: string,
  password: string,
): string {
  return `${protocol}\0${host}\0${String(port)}\0${username}\0${password}\0\0\0;`;
}

export function handleConnectUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer): void {
  const { pathname } = parse(req.url!, true);
  const connectionId = pathname ? extractConnectionId(pathname) : null;

  if (!connectionId) {
    socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
    socket.destroy();
    return;
  }

  auth.api
    .getSession({ headers: headersFromCookies(req) })
    .then(async (session) => {
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

      const handshakeTimeout = setTimeout(() => {
        guacdSocket.destroy();
      }, 10000);

      guacdSocket.once('connect', () => {
        clearTimeout(handshakeTimeout);
        const line = buildGuacdHandshake(conn.protocol, host, conn.port, conn.username, conn.credential);
        guacdSocket.write(line);
      });

      guacdSocket.once('error', () => {
        clearTimeout(handshakeTimeout);
        socket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n');
        socket.destroy();
      });

      const wss = new WebSocketServer({ noServer: true });

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
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
          }
        });

        // Cleanup
        ws.on('close', () => guacdSocket.destroy());
        guacdSocket.on('close', () => {
          if (ws.readyState === WebSocket.OPEN) ws.close();
        });
        ws.on('error', () => guacdSocket.destroy());
        guacdSocket.on('error', () => {
          if (ws.readyState === WebSocket.OPEN) ws.close();
        });
      });
    })
    .catch(() => {
      socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
      socket.destroy();
    });
}
