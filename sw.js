// Service Worker for Word Master 2.0
const CACHE_NAME = 'word-master-v2.1';
const APP_VERSION = '2.0.0';

// Resources to cache on install
const PRECACHE_URLS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './practice-mode.js',
  './daily-challenges.js',
  './game-modes.js',
  './achievements.js',
  './words-cache.js',
  './manifest.json',
  
  // External resources
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install event - cache essential resources
self.addEventListener('install', event => {
  console.log(`[Service Worker ${APP_VERSION}] Installing...`);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[Service Worker] Skip waiting');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Cache failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log(`[Service Worker ${APP_VERSION}] Activating...`);
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[Service Worker] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip chrome-extension requests
  if (requestUrl.protocol === 'chrome-extension:') return;
  
  // Handle API requests differently
  if (requestUrl.hostname.includes('api.') || 
      requestUrl.hostname.includes('datamuse.com') ||
      requestUrl.hostname.includes('kateglo.com')) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }
  
  // Handle app requests
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest)
          .then(response => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response
            const responseToCache = response.clone();
            
            // Cache the new resource
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // If both cache and network fail, show offline page
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
            
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Handle API requests with cache-first strategy
function handleApiRequest(request) {
  return caches.match(request)
    .then(cachedResponse => {
      if (cachedResponse) {
        // Return cached API response
        return cachedResponse;
      }
      
      // Fetch from network
      return fetch(request)
        .then(networkResponse => {
          // Cache the API response
          if (networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, responseToCache));
          }
          
          return networkResponse;
        })
        .catch(error => {
          console.error('[Service Worker] API fetch failed:', error);
          return new Response(JSON.stringify({
            error: 'Network error',
            offline: true
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        });
    });
}

// Background sync for offline data
self.addEventListener('sync', event => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-game-data') {
    event.waitUntil(syncGameData());
  }
});

async function syncGameData() {
  console.log('[Service Worker] Syncing game data...');
  
  // Get data from IndexedDB or localStorage
  const gameData = await getOfflineGameData();
  
  if (gameData && gameData.length > 0) {
    try {
      // This would send to your backend in a real app
      console.log('[Service Worker] Synced', gameData.length, 'games');
      
      // Clear local data after successful sync
      await clearOfflineGameData();
    } catch (error) {
      console.error('[Service Worker] Sync failed:', error);
      throw error; // Retry sync
    }
  }
}

// Helper functions
async function getOfflineGameData() {
  // Get from localStorage (simplified)
  const data = localStorage.getItem('wordMaster_offlineGames');
  return data ? JSON.parse(data) : [];
}

async function clearOfflineGameData() {
  localStorage.removeItem('wordMaster_offlineGames');
}

// Push notifications
self.addEventListener('push', event => {
  console.log('[Service Worker] Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'New daily challenge available!',
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22 fill=%22%234361ee%22>🔤</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22 fill=%22white%22>🔤</text></svg>',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 'daily-challenge'
    },
    actions: [
      {
        action: 'play',
        title: 'Play Now'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Word Master', options)
  );
});

self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click:', event.action);
  
  event.notification.close();
  
  if (event.action === 'play') {
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then(windowClients => {
          if (windowClients.length > 0) {
            const client = windowClients[0];
            client.focus();
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              action: 'play'
            });
          } else {
            clients.openWindow('/word/?tab=practice');
          }
        })
    );
  }
});

// Message handling
self.addEventListener('message', event => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'CACHE_ASSETS') {
    cacheAdditionalAssets(event.data.assets);
  }
});

async function cacheAdditionalAssets(assets) {
  const cache = await caches.open(CACHE_NAME);
  return Promise.all(
    assets.map(asset => cache.add(asset).catch(console.error))
  );
}

// Periodic sync (requires permission)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', event => {
    if (event.tag === 'update-dictionary') {
      event.waitUntil(updateDictionaryCache());
    }
  });
}

async function updateDictionaryCache() {
  console.log('[Service Worker] Updating dictionary cache...');
  // Update cached dictionary files
}