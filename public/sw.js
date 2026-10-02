self.addEventListener('install', (event) => {
  // Attiva subito il Service Worker
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
