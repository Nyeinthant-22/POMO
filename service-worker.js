// service-worker.js

// Define the cache name. Increment this version number whenever you make changes
// to the cached assets or the caching strategy, to ensure users get the latest version.
const CACHE_NAME = 'pomodoro-timer-v2';

// List of URLs to pre-cache during the 'install' event.
// These are the essential files for your application to load and function.
const urlsToCache = [
    '/', // The root URL of your application (often resolves to index.html)
    '/index.html',
    'https://cdn.tailwindcss.com', // Tailwind CSS CDN
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css', // Font Awesome CSS
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap', // Google Fonts CSS link
    // Note: The actual font files (e.g., .woff2) loaded by the Google Fonts CSS
    // will be handled by the 'fetch' strategy below when they are requested.
    './img/POMO_LOGO.png', // Your application's logo
    './audio/alarm_beep_3.mp3' // Your alarm sound file
];

/**
 * 'install' event listener:
 * This event is fired when the service worker is first registered.
 * It's used to pre-cache essential assets, making them available immediately offline.
 */
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching essential assets:', urlsToCache);
                // Add all specified URLs to the cache.
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('[Service Worker] Failed to cache during install:', error);
            })
    );
});

/**
 * 'activate' event listener:
 * This event is fired when the service worker becomes active.
 * It's commonly used to clean up old caches, ensuring only the latest version is used.
 */
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Delete any caches that are not the current CACHE_NAME.
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

/**
 * 'fetch' event listener:
 * This event is fired for every network request made by the page.
 * It allows the service worker to intercept requests and serve responses from the cache,
 * fetch from the network, or provide a fallback.
 *
 * Strategy: Cache First, then Network, with Network Fallback to Cache on failure.
 */
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // 1. Cache First: If a cached response is found, return it immediately.
            if (cachedResponse) {
                console.log('[Service Worker] Serving from cache:', event.request.url);
                return cachedResponse;
            }

            // 2. Network Request: If not in cache, try fetching from the network.
            console.log('[Service Worker] Fetching from network:', event.request.url);
            return fetch(event.request)
                .then((networkResponse) => {
                    // Check if we received a valid response from the network.
                    // 'basic' type ensures it's a standard response (not opaque for CORS issues).
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        // If the network response is not valid, just return it without caching.
                        return networkResponse;
                    }

                    // 3. Cache Network Response: Clone the response before caching,
                    // as a response stream can only be consumed once.
                    const responseToCache = networkResponse.clone();

                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                        console.log('[Service Worker] Cached new asset:', event.request.url);
                    }).catch((cacheError) => {
                        console.warn('[Service Worker] Failed to cache network response:', event.request.url, cacheError);
                    });

                    // Return the original network response to the page.
                    return networkResponse;
                })
                .catch((error) => {
                    // 4. Offline Fallback: If the network fetch fails (e.g., user is offline),
                    // try to return a cached response as a fallback.
                    console.error('[Service Worker] Network fetch failed for:', event.request.url, error);

                    // For navigation requests (like the root URL), fall back to index.html.
                    // For other assets, try to find them in the cache.
                    if (event.request.mode === 'navigate') {
                        return caches.match('/index.html');
                    }
                    // For other types of requests (e.g., images, scripts),
                    // if they were previously cached, they will be returned here.
                    return caches.match(event.request);
                });
        })
    );
});
