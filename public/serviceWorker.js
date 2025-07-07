self.addEventListener('install', event => console.log('ServiceWorker installed'));

/*self.addEventListener('push', event => {
  const options = {
    body: event.data.text(),
    icon: 'favicon.ico', // Replace with your icon path
  };
  event.waitUntil(
    self.registration.showNotification('Your App Name', options)
  );
});*/