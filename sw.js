// Service Worker for Word Master
const CACHE_NAME = 'word-master-v2';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './words-cache.js',
  './manifest.json'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app files');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  // API requests - network first, then cache
  if (event.request.url.includes('api.datamuse.com') || 
      event.request.url.includes('kateglo.com')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the API response
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // App files - cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then(response => {
            // Don't cache if not a success response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            // Cache the new response
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseToCache));
            return response;
          });
      })
  );
});

// Background sync for offline words
self.addEventListener('sync', event => {
  if (event.tag === 'sync-words') {
    event.waitUntil(syncWords());
  }
});

async function syncWords() {
  // Sync offline searches when back online
  console.log('Syncing offline data...');
}