/**
 * Browser Cookie Management Utility for HRMS Authentication & Session State.
 * Replaces client-side LocalStorage for tokens and sensitive session records.
 */

export const AUTH_COOKIE_KEYS = [
  'hrms_auth_token',
  'bearerToken',
  'accessToken',
  'refreshToken',
  'hrms_is_authenticated',
  'hrms_auth_user',
  'hrms_current_role',
  'hrms_portal_mode',
] as const;

export type AuthCookieKey = typeof AUTH_COOKIE_KEYS[number];

/**
 * Retrieve a cookie value by key.
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  try {
    const escaped = name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + escaped + '=([^;]*)'));
    if (!match) return null;
    return decodeURIComponent(match[1]);
  } catch (err) {
    console.warn(`Error reading cookie "${name}":`, err);
    return null;
  }
}

/**
 * Set a browser cookie with standard security attributes.
 * Defaults to 7-day expiration and SameSite=Lax.
 */
export function setCookie(name: string, value: string, days = 7): void {
  if (typeof document === 'undefined') return;

  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const secureFlag = isHttps ? '; Secure' : '';
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${secureFlag}`;
  } catch (err) {
    console.warn(`Error setting cookie "${name}":`, err);
  }
}

/**
 * Remove a browser cookie by expiring it immediately.
 */
export function removeCookie(name: string): void {
  if (typeof document === 'undefined') return;

  try {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
  } catch (err) {
    console.warn(`Error removing cookie "${name}":`, err);
  }
}

/**
 * Purge any legacy auth keys from browser localStorage so no auth tokens remain there.
 */
export function purgeAuthLocalStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    AUTH_COOKIE_KEYS.forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (err) {
    console.warn('Error purging auth tokens from localStorage:', err);
  }
}

