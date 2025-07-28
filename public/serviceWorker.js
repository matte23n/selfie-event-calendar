self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  return self.clients.claim();
});

self.addEventListener('push', (event) => {
  try {
    const data = event.data.json();
    const title = data.title || 'Selfie Event Calendar';
    const options = {
      body: data.body || 'New notification',
      icon: data.icon || '/favicon.ico',
      badge: data.badge || '/favicon.ico',
      tag: data.tag,
      requireInteraction: data.requireInteraction || false,
      data: data.data || {},
      actions: data.actions || [],
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (error) {
    const options = {
      body: event.data.text() || 'New notification',
      icon: '/favicon.ico',
    };
    event.waitUntil(self.registration.showNotification('Selfie Event Calendar', options));
  }
});

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};
  event.notification.close();
  const urlToOpen = new URL('/', self.location.origin);
  if (data.action === 'openTask' && data.taskId) {
    urlToOpen.searchParams.append('openTask', data.taskId);
  } else if (data.action === 'openEvent' && data.eventId) {
    urlToOpen.searchParams.append('openEvent', data.eventId);
  } else if (data.url) {
    return clients.openWindow(data.url);
  }
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            action: data.action,
            taskId: data.taskId,
            eventId: data.eventId,
            url: data.url,
          });
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen.href);
      }
    })
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe({ userVisibleOnly: true }).then((subscription) => {
      return fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription }),
      });
    })
  );
});