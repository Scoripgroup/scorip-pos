// SCORIP POS — Service Worker
const CACHE_NAME = 'scorip-pos-v1';
const STATIC_ASSETS = [
  '/css/style.css',
  '/css/pos.css',
  '/css/katalog.css',
  '/js/app.js',
  '/js/pos.js',
  '/js/dashboard.js',
  '/js/katalog.js',
  '/manifest.webmanifest',
];

// Install — cache static assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key !== CACHE_NAME;
        }).map(function(key) {
          return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch — network first for pages, cache first for assets
self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);

  // Cache-first for static assets
  if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset.split('/').pop()))) {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        return cached || fetch(event.request).then(function(response) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
          return response;
        });
      })
    );
    return;
  }

  // Network-first for everything else
  event.respondWith(
    fetch(event.request).catch(function() {
      return caches.match(event.request);
    })
  );
});
