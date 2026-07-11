import { createServer } from 'node:http';
import { parse } from 'node:url';
import next from 'next';
import { handleConnectUpgrade } from './lib/connect/ws-handler';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res, parse(req.url!, true));
  });

  server.on('upgrade', (req, socket, head) => {
    const { pathname } = parse(req.url!, true);
    if (pathname?.startsWith('/api/connect/')) {
      handleConnectUpgrade(req, socket, head);
    } else {
      socket.destroy();
    }
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
