/**
 * Dynamic Environment Configuration
 * 
 * Automatically loads the live backend URL directly from the physical .env file:
 * 1. Synchronously reads window.__HRMS_ENV__ (injected directly by RootLayout on every request from .env).
 * 2. Normalizes trailing slashes and ensures /api endpoints.
 * 3. Supports instant .env changes on browser refresh without restarting server.
 */

export function getApiBaseUrl(): string {
  // 1. If running in browser and accessed via external IP (e.g. mobile on Wi-Fi), adapt to current host
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      const protocol = window.location.protocol || 'http:';
      return `${protocol}//${host}:4000/api`;
    }
  }

  // 2. Direct synchronous server injection from physical .env file on every request
  if (typeof window !== 'undefined' && (window as any).__HRMS_ENV__?.apiUrl) {
    let clean = ((window as any).__HRMS_ENV__.apiUrl as string).trim().replace(/\/+$/, '');
    if (!clean.endsWith('/api')) clean = `${clean}/api`;
    return clean;
  }

  // 3. Client-side process.env fallback from .env
  const envUrl =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_BACKEND_URL) ||
    '';

  if (envUrl && envUrl.trim()) {
    let clean = envUrl.trim().replace(/\/+$/, '');
    if (!clean.endsWith('/api')) clean = `${clean}/api`;
    return clean;
  }

  return 'http://127.0.0.1:4000/api';
}

export function getSocketBaseUrl(): string {
  // 1. If running in browser and accessed via external IP (e.g. mobile on Wi-Fi), adapt to current host
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      const protocol = window.location.protocol || 'http:';
      return `${protocol}//${host}:4000`;
    }
  }

  // 2. Direct synchronous server injection from physical .env file on every request
  if (typeof window !== 'undefined' && (window as any).__HRMS_ENV__?.socketUrl) {
    return ((window as any).__HRMS_ENV__.socketUrl as string).trim().replace(/\/+$/, '');
  }

  // 3. Explicit process.env.NEXT_PUBLIC_SOCKET_URL
  const socketEnv = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SOCKET_URL;
  if (socketEnv && socketEnv.trim()) {
    return socketEnv.trim().replace(/\/+$/, '');
  }

  return 'http://localhost:4000';
}
