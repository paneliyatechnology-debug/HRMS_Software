import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  const nets = os.networkInterfaces();
  let localIp = '127.0.0.1';

  // Find non-internal IPv4 address (Wi-Fi or Ethernet)
  for (const name of Object.keys(nets)) {
    const list = nets[name];
    if (!list) continue;
    for (const net of list) {
      if (net.family === 'IPv4' && !net.internal) {
        localIp = net.address;
        break;
      }
    }
    if (localIp !== '127.0.0.1') break;
  }

  return NextResponse.json({
    ip: localIp,
    localUrl: 'http://localhost:3000',
    mobileUrl: `http://${localIp}:3000`,
    backendUrl: `http://${localIp}:4000`,
  });
}
