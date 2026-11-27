/**
 * Dynamic Environment Configuration
 * 
 * Strictly uses the backend and socket URLs configured in .env:
 * 1. Synchronously reads the hrms-live-env meta tag (written by RootLayout on every request from physical .env).
 * 2. Falls back to process.env.NEXT_PUBLIC_API_URL / NEXT_PUBLIC_SOCKET_URL.
 * 3. Normalizes trailing slashes, strips surrounding quotes, and ensures /api endpoints.
 * 4. Never overrides the configured .env URL with window.location.hostname.
 */

function cleanUrl(raw?: string): string {
  if (!raw) return '';
  return raw.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
}

function readLiveEnv(): { apiUrl?: string; socketUrl?: string } | null {
  if (typeof document === 'undefined') return null;
  const raw = document.querySelector('meta[name="hrms-live-env"]')?.getAttribute('content');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { apiUrl?: string; socketUrl?: string };
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function getApiBaseUrl(): string {
<<<<<<< HEAD
  // In the browser, route requests through frontend reverse proxy (/hrms-api) to maintain same-origin cookies and prevent 401 CORS issues.
  // Next.js rewrites in next.config.ts automatically and dynamically forward /hrms-api to the backend IP configured in .env (NEXT_PUBLIC_API_URL).
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/hrms-api`;
  }

  // Server-side / fallback
=======
  // 1. Direct synchronous server injection from physical .env file on every request (Priority 1)
  if (typeof window !== 'undefined' && (window as any).__HRMS_ENV__?.apiUrl) {
    let clean = cleanUrl((window as any).__HRMS_ENV__.apiUrl);
    if (clean) {
      if (!clean.endsWith('/api')) clean = `${clean}/api`;
      return clean;
    }
  }

  // 2. Client-side / Build-time process.env from .env (Priority 2)
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
  const envUrl =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_BACKEND_URL) ||
    '';

  const cleanEnv = cleanUrl(envUrl);
  if (cleanEnv) {
    return cleanEnv.endsWith('/api') ? cleanEnv : `${cleanEnv}/api`;
  }

<<<<<<< HEAD
  return 'http://192.168.1.103:4000/api';
=======
  // 3. Fallback only if no environment variable is provided in .env
  return 'http://localhost:4000/api';
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
}

export function getSocketBaseUrl(): string {
  // 1. Direct synchronous server injection from physical .env file on every request (Priority 1)
  const liveSocket = readLiveEnv()?.socketUrl;
  if (liveSocket) {
    const clean = cleanUrl(liveSocket);
    if (clean) return clean;
  }

  // 2. Explicit process.env.NEXT_PUBLIC_SOCKET_URL from .env (Priority 2)
  const socketEnv = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SOCKET_URL;
  const cleanEnv = cleanUrl(socketEnv || '');
  if (cleanEnv) {
    return cleanEnv;
  }

  // 3. Fallback only if no environment variable is provided in .env
  return 'http://192.168.1.103:4000';
}

