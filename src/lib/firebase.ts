'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  deleteToken,
  type Messaging,
  type MessagePayload,
  type Unsubscribe,
} from 'firebase/messaging';

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export function getFirebaseWebConfig(): FirebaseWebConfig {
  return {
    apiKey: (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '').trim(),
    authDomain: (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '').trim(),
    projectId: (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '').trim(),
    storageBucket: (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '').trim(),
    messagingSenderId: (process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '').trim(),
    appId: (process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '').trim(),
  };
}

export function getFirebaseVapidKey(): string {
  return (process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '').trim();
}

export function hasFirebaseWebConfig(): boolean {
  const cfg = getFirebaseWebConfig();
  return Boolean(
    cfg.apiKey &&
    cfg.authDomain &&
    cfg.projectId &&
    cfg.messagingSenderId &&
    cfg.appId &&
    getFirebaseVapidKey(),
  );
}

export function getNotificationPermissionState(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported';
  }
  return Notification.permission;
}

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') return null;
  const cfg = getFirebaseWebConfig();
  if (!cfg.apiKey || !cfg.projectId || !cfg.messagingSenderId || !cfg.appId) {
    return null;
  }
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(cfg);
}

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null;
  try {
    const supported = await isSupported();
    if (!supported) return null;
    const app = getFirebaseApp();
    if (!app) return null;
    return getMessaging(app);
  } catch {
    return null;
  }
}

export async function registerFcmServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  const cfg = getFirebaseWebConfig();
  const params = new URLSearchParams({
    apiKey: cfg.apiKey,
    authDomain: cfg.authDomain,
    projectId: cfg.projectId,
    storageBucket: cfg.storageBucket,
    messagingSenderId: cfg.messagingSenderId,
    appId: cfg.appId,
  });
  const swUrl = `/firebase-messaging-sw.js?${params.toString()}`;
  const reg = await navigator.serviceWorker.register(swUrl, { scope: '/' });
  await navigator.serviceWorker.ready;
  return reg;
}

export async function requestFcmToken(): Promise<{
  token: string | null;
  permission: NotificationPermission | 'unsupported';
  error?: string;
}> {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return { token: null, permission: 'unsupported', error: 'Browser notifications are not supported.' };
  }
  if (!hasFirebaseWebConfig()) {
    return {
      token: null,
      permission: Notification.permission,
      error: 'Firebase Web configuration is missing in .env.local.',
    };
  }
  const supported = await isSupported().catch(() => false);
  if (!supported) {
    return { token: null, permission: 'unsupported', error: 'Firebase Cloud Messaging is not supported in this browser.' };
  }

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }
  if (permission !== 'granted') {
    return {
      token: null,
      permission,
      error: permission === 'denied' ? 'Notification permission was denied in browser settings.' : 'Notification permission was not granted.',
    };
  }

  try {
    const registration = await registerFcmServiceWorker();
    if (!registration) {
      return { token: null, permission, error: 'Service worker registration failed.' };
    }
    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      return { token: null, permission, error: 'Firebase Messaging could not be initialized.' };
    }
    const token = await getToken(messaging, {
      vapidKey: getFirebaseVapidKey(),
      serviceWorkerRegistration: registration,
    });
    if (!token) {
      return { token: null, permission, error: 'Could not generate FCM registration token.' };
    }
    return { token, permission };
  } catch (err) {
    return {
      token: null,
      permission,
      error: err instanceof Error ? err.message : 'Failed to generate FCM token.',
    };
  }
}

export async function clearFcmToken(): Promise<void> {
  try {
    const messaging = await getFirebaseMessaging();
    if (messaging) {
      await deleteToken(messaging);
    }
  } catch {
    // Best-effort cleanup
  }
}

export async function subscribeForegroundMessages(
  callback: (payload: MessagePayload) => void,
): Promise<Unsubscribe | null> {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;
  return onMessage(messaging, callback);
}
