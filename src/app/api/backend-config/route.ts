import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  let apiUrl = '';
  let socketUrl = '';

  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const apiMatch = content.match(/NEXT_PUBLIC_API_URL\s*=\s*([^\r\n]+)/);
      const socketMatch = content.match(/NEXT_PUBLIC_SOCKET_URL\s*=\s*([^\r\n]+)/);
      if (apiMatch) apiUrl = apiMatch[1].trim();
      if (socketMatch) socketUrl = socketMatch[1].trim();
    }
  } catch (err) {
    console.warn('Could not read .env from disk:', err);
  }

  if (!apiUrl) {
    apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
  }
  if (!socketUrl) {
    socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || '';
  }

  return NextResponse.json({
    apiUrl,
    socketUrl,
    timestamp: Date.now(),
  });
}
