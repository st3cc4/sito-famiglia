// Service Worker per la PWA della Famiglia
const CACHE_NAME = 'famiglia-pwa-v1';
const urlsToCache = [
  './index.html',
  './script.js',
  './style.css',
  './auth.js',
  './firebase-config.js',
  './manifest.json',
  './impegni/impegni.js',
  './impegni/stile_impegni.css',
  './media/media.js',
  './media/stile_media.css',
  './ricette/ricette.js',
  './ricette/stile_ricette.css',
  './scadenze/stile_scadenze.css',
  './utenti/utenti.js',
  './utenti/stile_utenti.css'
];

// Installazione del Service Worker e memorizzazione in cache dei file principali
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aperta con successo');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.error('Errore durante il salvataggio in cache:', err);
      })
  );
  self.skipWaiting();
});

// Attivazione del Service Worker e pulizia delle vecchie cache
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

// Gestione delle richieste di rete con strategia Cache-First e fallback su Network
self.addEventListener('fetch', (event) => {
  // Ignora le richieste verso Firebase o domini esterni
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((response) => {
          // Risposta valida, la restituiamo
          return response;
        });
      })
      .catch(() => {
        // Fallback offline opzionale se la pagina non è disponibile
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      })
  );
});
