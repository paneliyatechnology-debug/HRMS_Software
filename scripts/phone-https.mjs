import fs from 'fs';
import http from 'http';
import https from 'https';
import path from 'path';

const pfxPath = process.argv[2];
const passphrase = process.argv[3];
if (!pfxPath || !passphrase) {
  console.error('Certificate path and passphrase are required.');
  process.exit(1);
}

function forward(req, res) {
  const headers = { ...req.headers, host: '127.0.0.1:3000' };
  const proxy = http.request(
    {
      host: '127.0.0.1',
      port: 3000,
      method: req.method,
      path: req.url,
      headers,
    },
    (upstream) => {
      res.writeHead(upstream.statusCode || 502, upstream.headers);
      upstream.pipe(res);
    },
  );
  proxy.on('error', () => {
    if (!res.headersSent) res.writeHead(502);
    res.end('The site on port 3000 is not running.');
  });
  req.pipe(proxy);
}

const server = https.createServer(
  { pfx: fs.readFileSync(pfxPath), passphrase },
  forward,
);

server.on('upgrade', (req, socket, head) => {
  const proxy = http.request({
    host: '127.0.0.1',
    port: 3000,
    method: req.method,
    path: req.url,
    headers: { ...req.headers, host: '127.0.0.1:3000' },
  });
  proxy.on('upgrade', (upstream, upstreamSocket, upstreamHead) => {
    const lines = [`HTTP/1.1 ${upstream.statusCode} ${upstream.statusMessage || ''}`];
    for (const [key, value] of Object.entries(upstream.headers)) {
      const list = Array.isArray(value) ? value : [value];
      for (const item of list) {
        if (item != null) lines.push(`${key}: ${item}`);
      }
    }
    socket.write(`${lines.join('\r\n')}\r\n\r\n`);
    if (upstreamHead?.length) socket.write(upstreamHead);
    if (head?.length) upstreamSocket.write(head);
    upstreamSocket.pipe(socket);
    socket.pipe(upstreamSocket);
  });
  proxy.on('error', () => socket.destroy());
  proxy.end();
});

server.listen(3443, '0.0.0.0', () => {
  console.log(`Phone camera link: https://${process.env.HRMS_LAN_IP || '127.0.0.1'}:3443`);
});
