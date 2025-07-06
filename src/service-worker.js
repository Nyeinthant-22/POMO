const CACHE_NAME = 'pomo-timer-cache-v1';
const urlsToCache = [
    // Removed '../' as it can cause issues with cache.addAll()
    '../index.html',
    '../img/POMO_LOGO.png',
    '../audio/alarm_beep_3.mp3',
    // External CDN links remain the same as they are absolute URLs
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Failed to open cache or add URLs:', error);
                // Log the specific URL that failed if possible for better debugging
                // This catch block helps prevent the service worker from getting stuck
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then(
                    response => {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        return response;
                    }
                );
            })
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
