const CACHE_NAME = 'famiglia-cache-v2';
const urlsToCache = [
  './index.html',
  './home.html',
  './manifest.json'
];

// Installazione del Service Worker e caching dei file principali
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aperta con successo');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Attivazione e pulizia delle vecchie cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminazione vecchia cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Intercettazione delle richieste di rete
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});

// Gestione delle notifiche push locali ricevute dall'app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'MOSTRA_NOTIFICA') {
    const { titolo, corpo } = event.data;
    const options = {
      body: corpo,
      icon: './assets/icon-192.png',
      badge: './assets/icon-192.png',
      vibrate: [200, 100, 200]
    };
    self.registration.showNotification(titolo, options);
  }
});

// Gestione del click sulla notifica per riportare l'utente sull'app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      if (windowClients.length > 0) {
        return windowClients[0].focus();
      }
      return clients.openWindow('./home.html');
    })
  );
});
