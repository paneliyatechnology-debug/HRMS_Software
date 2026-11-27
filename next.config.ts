import type { NextConfig } from "next";
import os from "os";

function getLocalIps(): string[] {
  const ips: string[] = [];
  try {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (net.family === "IPv4" && !net.internal) {
          ips.push(net.address);
          const parts = net.address.split(".");
          if (parts.length === 4) {
            ips.push(`${parts[0]}.${parts[1]}.${parts[2]}.*`);
            ips.push(`${parts[0]}.${parts[1]}.*.*`);
          }
        }
      }
    }
  } catch (_) { }
  return Array.from(new Set(ips));
}

const localIps = getLocalIps();

const backendBase = (process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.103:4000').trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
const backendApiUrl = backendBase.endsWith('/api') ? backendBase : `${backendBase}/api`;

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/hrms-api/:path*',
        destination: 'http://127.0.0.1:4000/api/:path*',
      },
    ];
  },
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.1.105",
    "192.168.1.108",
    "192.168.1.*",
    "192.168.*.*",
    "10.*.*.*",
    "172.16.*.*",
    "*.local",
    "*.loca.lt",
    "loca.lt",
    "*.trycloudflare.com",
    "trycloudflare.com",
    ...localIps,
  ],
  turbopack: {
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
