/**
 * Dynamic Environment Configuration
 * 
 * Automatically loads the live backend URL directly from the physical .env file:
 * 1. Synchronously reads window.__HRMS_ENV__ (injected directly by RootLayout on every request from .env).
 * 2. Normalizes trailing slashes and ensures /api endpoints.
 * 3. Supports instant .env changes on browser refresh without restarting server.
 */

export function getApiBaseUrl(): string {
  // 1. Direct synchronous server injection from physical .env file on every request
  if (typeof window !== 'undefined' && (window as any).__HRMS_ENV__?.apiUrl) {
    let clean = ((window as any).__HRMS_ENV__.apiUrl as string).trim().replace(/\/+$/, '');
    if (!clean.endsWith('/api')) clean = `${clean}/api`;
    return clean;
  }

  // 2. Client-side process.env fallback
  const envUrl =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_BACKEND_URL) ||
    '';

  if (!envUrl) {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      return `${window.location.protocol}//${window.location.hostname}:4000/api`;
    }
    return 'http://localhost:4000/api';
  }

  let clean = envUrl.trim().replace(/\/+$/, '');
  if (!clean.endsWith('/api')) {
    clean = `${clean}/api`;
  }
  return clean;
}

export function getSocketBaseUrl(): string {
  // 1. Direct synchronous server injection from physical .env file on every request
  if (typeof window !== 'undefined' && (window as any).__HRMS_ENV__?.socketUrl) {
    return ((window as any).__HRMS_ENV__.socketUrl as string).trim().replace(/\/+$/, '');
  }

  // 2. Explicit process.env.NEXT_PUBLIC_SOCKET_URL
  const socketEnv = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SOCKET_URL;
  if (socketEnv && socketEnv.trim()) {
    return socketEnv.trim().replace(/\/+$/, '');
  }

  // 3. Derive from API URL
  const apiBase = getApiBaseUrl();
  return apiBase.replace(/\/api\/?$/, '').replace(/\/+$/, '');
}
