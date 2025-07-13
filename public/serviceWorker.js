self.addEventListener('install', event => {
  console.log('ServiceWorker installed');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('ServiceWorker activated');
  return self.clients.claim();
});

self.addEventListener('push', event => {
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
      actions: data.actions || []
    };
    
    console.log('Received push notification:', data);
    
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('Error showing notification:', error);
    
    // Fallback for plain text
    const options = {
      body: event.data.text() || 'New notification',
      icon: '/favicon.ico'
    };
    
    event.waitUntil(
      self.registration.showNotification('Selfie Event Calendar', options)
    );
  }
});

self.addEventListener('notificationclick', event => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};
  
  console.log('Notification clicked:', notification);
  console.log('Action:', action);
  console.log('Data:', data);
  
  event.notification.close();
  
  // Handle different actions based on the notification data
  const urlToOpen = new URL('/', self.location.origin);
  
  if (data.action === 'openTask' && data.taskId) {
    urlToOpen.searchParams.append('openTask', data.taskId);
  } else if (data.action === 'openEvent' && data.eventId) {
    urlToOpen.searchParams.append('openEvent', data.eventId);
  } else if (data.url) {
    return clients.openWindow(data.url);
  }
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(windowClients => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        // If so, focus on that window/tab
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            action: data.action,
            taskId: data.taskId,
            eventId: data.eventId,
            url: data.url
          });
          return;
        }
      }
      
      // If not, then open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen.href);
      }
    })
  );
});

self.addEventListener('pushsubscriptionchange', event => {
  console.log('Subscription expired');
  event.waitUntil(
    self.registration.pushManager.subscribe({ userVisibleOnly: true })
      .then(subscription => {
        console.log('Subscribed after expiration', subscription);
        // You would normally send this subscription to your server
        return fetch('/api/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ subscription })
        });
      })
  );
});