/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/13.4.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/13.4.0/firebase-messaging-compat.js');

(function initFirebaseMessagingSw() {
  try {
    const url = new URL(self.location.href);
    const config = {
      apiKey: url.searchParams.get('apiKey') || '',
      authDomain: url.searchParams.get('authDomain') || '',
      projectId: url.searchParams.get('projectId') || '',
      storageBucket: url.searchParams.get('storageBucket') || '',
      messagingSenderId: url.searchParams.get('messagingSenderId') || '',
      appId: url.searchParams.get('appId') || '',
    };

    if (!config.apiKey || !config.projectId || !config.messagingSenderId || !config.appId) {
      return;
    }

    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }

    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      // If payload already includes a `notification` block, FCM displays it automatically.
      // Only show a manual notification for data-only payloads to prevent duplicates.
      if (payload && payload.notification) {
        return;
      }

      const data = (payload && payload.data) || {};
      const title = data.title || 'HRMS Notification';
      const body = data.body || data.message || '';
      const tag = data.id || data.tag || 'hrms-fcm';

      self.registration.showNotification(title, {
        body,
        icon: '/icon.png',
        badge: '/icon.png',
        tag,
        data: {
          url: data.url || '',
          module: data.module || 'notifications',
        },
      });
    });
  } catch {
    // Ignore initialization errors when SW is loaded without query config
  }
})();

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = (event.notification && event.notification.data) || {};
  const targetPath = data.url || (data.module ? `/${String(data.module).replace(/^\/+/, '')}` : '/notifications');
  const targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client && client.url !== targetUrl) {
            return client.navigate(targetUrl);
          }
          return client;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    }),
  );
});
