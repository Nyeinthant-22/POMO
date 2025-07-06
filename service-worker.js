// service-worker.js

const CACHE_NAME = 'pomodoro-timer-v1';
const urlsToCache = [
    '/',
    '/index.html',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
    './img/POMO_LOGO.png', // Make sure this path is correct relative to index.html
    './audio/alarm_beep_3.mp3' // Make sure this path is correct relative to index.html
];

// Install event: Caches all the essential assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('Failed to cache during install:', error);
            })
    );
});

// Fetch event: Intercepts network requests and serves from cache if available
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // If the request is in the cache, return the cached response
                if (response) {
                    console.log('Serving from cache:', event.request.url);
                    return response;
                }
                // Otherwise, fetch from the network
                console.log('Fetching from network:', event.request.url);
                return fetch(event.request).catch((error) => {
                    console.error('Fetch failed:', error);
                    // You can return a fallback page here for offline scenarios if needed
                    // For example, return caches.match('/offline.html');
                });
            })
    );
});

// Activate event: Cleans up old caches
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        // Delete old caches
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
