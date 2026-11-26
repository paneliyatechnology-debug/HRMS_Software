import https from 'node:https';
import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const TARGET_HOST = '127.0.0.1';
const TARGET_PORT = Number(process.env.HTTP_PORT || 3000);
const HTTPS_PORT = Number(process.env.HTTPS_PORT || 3443);

const certDir = path.join(process.cwd(), 'certificates');
const keyPath = path.join(certDir, 'localhost-key.pem');
const certPath = path.join(certDir, 'localhost.pem');

function getLocalIpList() {
  const ips = ['127.0.0.1'];
  try {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const n of nets[name] || []) {
        if (n.family === 'IPv4' && !n.internal) ips.push(n.address);
      }
    }
  } catch {}
  return Array.from(new Set(ips));
}

function ensureCert() {
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) return;
  fs.mkdirSync(certDir, { recursive: true });
  const opensslBin = fs.existsSync('C:\\Program Files\\Git\\usr\\bin\\openssl.exe')
    ? 'C:\\Program Files\\Git\\usr\\bin\\openssl.exe'
    : 'openssl';
  const sanEntries = [
    'DNS:localhost',
    ...getLocalIpList().map((ip) => `IP:${ip}`),
  ].join(',');
  execFileSync(opensslBin, [
    'req',
    '-x509',
    '-newkey',
    'rsa:2048',
    '-nodes',
    '-keyout',
    keyPath,
    '-out',
    certPath,
    '-days',
    '365',
    '-subj',
    '/CN=localhost',
    '-addext',
    `subjectAltName=${sanEntries}`,
  ]);
}

ensureCert();

const server = https.createServer(
  {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  },
  (req, res) => {
    const proxyReq = http.request(
      {
        hostname: TARGET_HOST,
        port: TARGET_PORT,
        path: req.url,
        method: req.method,
        headers: {
          ...req.headers,
          'x-forwarded-proto': 'https',
          'x-forwarded-host': req.headers.host || '',
        },
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      },
    );
    proxyReq.on('error', (err) => {
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'text/plain' });
      }
      res.end(`HTTPS proxy error: ${err.message}`);
    });
    req.pipe(proxyReq, { end: true });
  },
);

server.on('upgrade', (req, socket, head) => {
  const target = net.connect(TARGET_PORT, TARGET_HOST, () => {
    const rawHeaders = Object.entries(req.headers)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
      .join('\r\n');
    target.write(`${req.method} ${req.url} HTTP/${req.httpVersion}\r\n${rawHeaders}\r\n\r\n`);
    if (head && head.length) target.write(head);
    socket.pipe(target).pipe(socket);
  });
  target.on('error', () => socket.destroy());
  socket.on('error', () => target.destroy());
});

server.listen(HTTPS_PORT, '0.0.0.0', () => {
  console.log(`HTTPS proxy listening on https://0.0.0.0:${HTTPS_PORT} -> http://${TARGET_HOST}:${TARGET_PORT}`);
  for (const ip of getLocalIpList()) {
    console.log(`  Mobile Face Clock: https://${ip}:${HTTPS_PORT}/face-clock`);
  }
});
