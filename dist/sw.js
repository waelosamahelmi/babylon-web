const CACHE_NAME = 'babylon-customer-v4';
const STATIC_CACHE_NAME = 'babylon-static-v4';

// Cache static assets only
const urlsToCache = [
  '/',
  '/manifest.json',
  '/generated-icon.png',
  '/favicon.ico'
];

// Assets that should always be fetched fresh
const BYPASS_CACHE_PATTERNS = [
  /\/src\/main\.tsx$/,
  /\/assets\/.*\.js$/,
  /\/assets\/.*\.mjs$/,
  /\/assets\/.*\.css$/,
  /\.js\?/,
  /\.mjs\?/,
  /api\//
];

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker installation complete');
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activation complete');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip unsupported schemes (chrome-extension, etc.)
  if (!url.protocol.startsWith('http')) {
    console.log('Skipping unsupported scheme:', url.protocol);
    return;
  }
  
  // Skip caching for module scripts and API calls
  const shouldBypassCache = BYPASS_CACHE_PATTERNS.some(pattern => 
    pattern.test(url.pathname) || pattern.test(url.search)
  );
  
  if (shouldBypassCache) {
    console.log('Bypassing cache for:', url.pathname);
    event.respondWith(
      fetch(event.request).catch(() => {
        // If fetch fails for critical assets, try cache as fallback
        return caches.match(event.request);
      })
    );
    return;
  }
  
  // For other requests, use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          console.log('Cache hit for:', url.pathname);
          return response;
        }
        
        console.log('Cache miss, fetching:', url.pathname);
        return fetch(event.request).then((response) => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Only cache http/https requests
          if (!event.request.url.startsWith('http')) {
            return response;
          }
          
          // Clone the response for caching
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache).catch((error) => {
                console.error('Failed to cache request:', error);
              });
            });
          
          return response;
        });
      })
  );
});