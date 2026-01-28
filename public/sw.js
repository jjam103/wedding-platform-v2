/**
 * Service Worker for Costa Rica Wedding PWA
 * 
 * Implements:
 * - Cache-first strategy for static assets
 * - Network-first strategy for dynamic data
 * - Itinerary caching for offline access
 * - Offline indicators and sync queue
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const ITINERARY_CACHE = `itinerary-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// API routes that should use network-first strategy
const NETWORK_FIRST_ROUTES = [
  '/api/guest/rsvp',
  '/api/guest/events',
  '/api/guest/activities',
  '/api/admin/',
];

// API routes that should use cache-first strategy
const CACHE_FIRST_ROUTES = [
  '/api/guest/itinerary',
  '/api/guest/accommodation',
];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      console.log('[SW] Service worker installed');
      return self.skipWaiting();
    })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Delete old caches
            return cacheName.startsWith('static-') ||
                   cacheName.startsWith('dynamic-') ||
                   cacheName.startsWith('itinerary-') ||
                   cacheName.startsWith('images-') &&
                   cacheName !== STATIC_CACHE &&
                   cacheName !== DYNAMIC_CACHE &&
                   cacheName !== ITINERARY_CACHE &&
                   cacheName !== IMAGE_CACHE;
          })
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log('[SW] Service worker activated');
      return self.clients.claim();
    })
  );
});

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and other origins
  if (!url.origin.includes(self.location.origin)) {
    return;
  }

  // Determine caching strategy based on route
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (isImage(url.pathname)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
  } else if (isItineraryRoute(url.pathname)) {
    event.respondWith(cacheFirstWithUpdate(request, ITINERARY_CACHE));
  } else if (isCacheFirstRoute(url.pathname)) {
    event.respondWith(cacheFirstWithUpdate(request, DYNAMIC_CACHE));
  } else if (isNetworkFirstRoute(url.pathname)) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  } else {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  }
});

/**
 * Cache-first strategy
 * Try cache first, fall back to network
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    console.log('[SW] Cache hit:', request.url);
    return cached;
  }
  
  console.log('[SW] Cache miss, fetching:', request.url);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Cache-first with background update
 * Return cached version immediately, update cache in background
 */
async function cacheFirstWithUpdate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // Fetch in background to update cache
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch((error) => {
    console.error('[SW] Background fetch failed:', error);
  });
  
  // Return cached version immediately if available
  if (cached) {
    console.log('[SW] Cache hit (with update):', request.url);
    return cached;
  }
  
  // Wait for network if no cache
  console.log('[SW] Cache miss, waiting for network:', request.url);
  try {
    return await fetchPromise;
  } catch (error) {
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Network-first strategy
 * Try network first, fall back to cache
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    console.log('[SW] Network first, fetching:', request.url);
    const response = await fetch(request);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Network failed, trying cache:', error);
    const cached = await cache.match(request);
    
    if (cached) {
      console.log('[SW] Serving from cache:', request.url);
      return cached;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlinePage = await cache.match('/offline');
      if (offlinePage) {
        return offlinePage;
      }
    }
    
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Check if URL is a static asset
 */
function isStaticAsset(pathname) {
  return pathname.startsWith('/_next/static/') ||
         pathname.endsWith('.css') ||
         pathname.endsWith('.js') ||
         pathname === '/manifest.json' ||
         pathname.startsWith('/icons/');
}

/**
 * Check if URL is an image
 */
function isImage(pathname) {
  return pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i);
}

/**
 * Check if URL is an itinerary route
 */
function isItineraryRoute(pathname) {
  return pathname.includes('/api/guest/itinerary') ||
         pathname.includes('/guest/itinerary');
}

/**
 * Check if URL should use cache-first strategy
 */
function isCacheFirstRoute(pathname) {
  return CACHE_FIRST_ROUTES.some(route => pathname.includes(route));
}

/**
 * Check if URL should use network-first strategy
 */
function isNetworkFirstRoute(pathname) {
  return NETWORK_FIRST_ROUTES.some(route => pathname.includes(route));
}

/**
 * Background sync for offline actions
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-rsvps') {
    event.waitUntil(syncRSVPs());
  } else if (event.tag === 'sync-photos') {
    event.waitUntil(syncPhotos());
  }
});

/**
 * Sync queued RSVPs
 */
async function syncRSVPs() {
  console.log('[SW] Syncing RSVPs...');
  
  try {
    const cache = await caches.open('sync-queue');
    const requests = await cache.keys();
    const rsvpRequests = requests.filter(req => req.url.includes('/api/guest/rsvp'));
    
    for (const request of rsvpRequests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.delete(request);
          console.log('[SW] RSVP synced:', request.url);
        }
      } catch (error) {
        console.error('[SW] Failed to sync RSVP:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Sync RSVPs failed:', error);
  }
}

/**
 * Sync queued photos
 */
async function syncPhotos() {
  console.log('[SW] Syncing photos...');
  
  try {
    const cache = await caches.open('sync-queue');
    const requests = await cache.keys();
    const photoRequests = requests.filter(req => req.url.includes('/api/guest/photos'));
    
    for (const request of photoRequests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.delete(request);
          console.log('[SW] Photo synced:', request.url);
        }
      } catch (error) {
        console.error('[SW] Failed to sync photo:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Sync photos failed:', error);
  }
}

/**
 * Push notification handler
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Costa Rica Wedding';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: data.url || '/',
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'close', title: 'Close' },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/**
 * Notification click handler
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    const url = event.notification.data || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});

/**
 * Message handler for client communication
 */
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'CACHE_ITINERARY') {
    event.waitUntil(cacheItinerary(event.data.payload));
  } else if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(clearAllCaches());
  }
});

/**
 * Cache itinerary data
 */
async function cacheItinerary(data) {
  console.log('[SW] Caching itinerary data');
  
  try {
    const cache = await caches.open(ITINERARY_CACHE);
    const response = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
    await cache.put('/api/guest/itinerary', response);
    console.log('[SW] Itinerary cached successfully');
  } catch (error) {
    console.error('[SW] Failed to cache itinerary:', error);
  }
}

/**
 * Clear all caches
 */
async function clearAllCaches() {
  console.log('[SW] Clearing all caches');
  
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    console.log('[SW] All caches cleared');
  } catch (error) {
    console.error('[SW] Failed to clear caches:', error);
  }
}
