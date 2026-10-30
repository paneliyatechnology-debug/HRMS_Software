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
  } catch (_) {}
  return Array.from(new Set(ips));
}

const localIps = getLocalIps();

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.1.106",
    "192.168.1.*",
    "192.168.*.*",
    "10.*.*.*",
    "172.16.*.*",
    "*.local",
    ...localIps,
  ],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
