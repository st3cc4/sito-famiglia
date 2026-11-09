const CACHE_NAME = 'sito-famiglia-v1';
const urlsToCache = [
  './',
  './index.html',
  './index.js',
  './home.html',
  './login/login.html',
  './login/stile-login.css',
  './login/login.js',
  './home/stile-home.css',
  './home/home.js',
  './home/firebase-config.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
