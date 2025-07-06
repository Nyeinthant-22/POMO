// service-worker.js

// Define the cache name. Increment this version number whenever you make changes
// to the cached assets or the caching strategy, to ensure users get the latest version.
const CACHE_NAME = 'pomodoro-timer-v5'; // Incremented cache version for new strategy

// List of URLs to pre-cache during the 'install' event.
// These are the essential files for your application to load and function.
const urlsToCache = [
    '/', // The root URL of your application (often resolves to index.html)
    '/index.html',
    './img/POMO_LOGO.png', // Your application's logo
    './audio/alarm_beep_3.mp3' // Your alarm sound file
];

// URLs for external assets that might have CORS issues, handled separately.
// These are the CSS files that *request* the actual fonts.
const externalCssUrlsToCache = [
    'https://cdn.tailwindcss.com', // Tailwind CSS CDN
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css', // Font Awesome CSS
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap' // Google Fonts CSS link
];

/**
 * 'install' event listener:
 * This event is fired when the service worker is first registered.
 * It's used to pre-cache essential assets, making them available immediately offline.
 *
 * Modified to use Promise.allSettled for caching, allowing some external fetches
 * to fail gracefully without preventing the entire installation.
 */
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async (cache) => {
                console.log('[Service Worker] Caching essential local assets:', urlsToCache);
                // Cache local assets directly
                await cache.addAll(urlsToCache);

                console.log('[Service Worker] Attempting to cache external CSS assets:', externalCssUrlsToCache);
                // Attempt to cache external CSS assets. Use Promise.allSettled to allow some to fail.
                const results = await Promise.allSettled(
                    externalCssUrlsToCache.map(url =>
                        fetch(url, { mode: 'no-cors' }) // Fetch with no-cors
                            .then(response => {
                                if (response.ok || response.type === 'opaque') { // Check for ok status or opaque response
                                    return cache.put(url, response);
                                } else {
                                    throw new Error(`Failed to fetch and cache (status: ${response.status}): ${url}`);
                                }
                            })
                    )
                );

                results.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        console.log(`[Service Worker] Successfully cached: ${externalCssUrlsToCache[index]}`);
                    } else {
                        console.warn(`[Service Worker] Failed to cache (CORS/Network): ${externalCssUrlsToCache[index]} - ${result.reason}`);
                    }
                });
            })
            .catch((error) => {
                console.error('[Service Worker] General installation error:', error);
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
 * This is crucial for handling dynamically requested assets like fonts.
 */
self.addEventListener('fetch', (event) => {
    // IMPORTANT: Ignore requests that are not for HTTP/HTTPS schemes (e.g., chrome-extension://)
    if (!event.request.url.startsWith('http')) {
        return; // Do not intercept non-HTTP/HTTPS requests
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // If a cached response is found, return it immediately.
            if (cachedResponse) {
                console.log('[Service Worker] Serving from cache:', event.request.url);
                return cachedResponse;
            }

            // If not in cache, try fetching from the network.
            console.log('[Service Worker] Fetching from network:', event.request.url);

            // Determine if the request is for an external resource that might need 'no-cors'
            // This is especially important for fonts (woff2, ttf, etc.) which are typically external.
            const isExternal = !event.request.url.startsWith(self.location.origin);
            const fetchOptions = isExternal ? { mode: 'no-cors' } : {};

            return fetch(event.request, fetchOptions)
                .then((networkResponse) => {
                    // Check if we received a valid response from the network.
                    // For 'no-cors' requests, networkResponse.ok will be false, but type will be 'opaque'.
                    if (!networkResponse || (!networkResponse.ok && networkResponse.type !== 'opaque')) {
                        // If the network response is not valid (and not opaque), just return it without caching.
                        return networkResponse;
                    }

                    // Clone the response before caching, as a response stream can only be consumed once.
                    const responseToCache = networkResponse.clone();

                    // Only cache successful responses (or opaque ones from no-cors)
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
                    // If the network fetch fails (e.g., user is offline),
                    // try to return a cached response as a fallback.
                    console.error('[Service Worker] Network fetch failed for:', event.request.url, error);

                    // For navigation requests (like the root URL), fall back to index.html.
                    if (event.request.mode === 'navigate') {
                        return caches.match('/index.html');
                    }
                    // For other types of requests (e.g., images, scripts, *fonts*),
                    // if they were previously cached, they will be returned here.
                    return caches.match(event.request);
                });
        })
    );
});
