/**
 * Dynamic Environment Configuration
 * 
 * All API and WebSocket URLs are dynamically loaded directly from the .env file.
 * Automatically normalizes trailing slashes and ensures /api endpoints without
 * needing any hardcoded URLs in the project.
 */

export function getApiBaseUrl(): string {
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
  const socketEnv = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SOCKET_URL;
  if (socketEnv && socketEnv.trim()) {
    return socketEnv.trim().replace(/\/+$/, '');
  }

  const apiEnv =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_BACKEND_URL) ||
    '';

  if (apiEnv && apiEnv.trim()) {
    return apiEnv.trim().replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:4000`;
  }

  return 'http://localhost:4000';
}
