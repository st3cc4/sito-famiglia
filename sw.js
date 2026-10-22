// Service Worker per Famiglia - Versione sicura
const CACHE_NAME = 'famiglia-cache-v3';
const urlsToCache = [
  '/',
  '/index.html'
];

// Installazione del Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.log('Errore durante l\'installazione della cache:', err);
      })
  );
  self.skipWaiting();
});

// Attivazione e pulizia delle vecchie cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Gestione delle richieste con fallback sicuro (evita blocchi Failed to fetch)
self.addEventListener('fetch', event => {
  // Ignora richieste non GET o relative a estensioni del browser
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        return response;
      })
      .catch(() => {
        // Se la rete fallisce, prova a recuperare dalla cache
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Se è una richiesta di navigazione, restituisce index.html come fallback
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          // Fallback generico per evitare crash
          return new Response('Connessione assente o risorsa non disponibile', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        });
      })
  );
});
