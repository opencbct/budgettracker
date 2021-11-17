'use strict'

const FILES_TO_CACHE = [
    "/",
    `/db.js`,
    `/index.html`,
    `/index.js`,
    `/index.css`,
    `/manifest.webmanifest`,
    `/img/icons/money.png`
];

const STATIC_CACHE = `static-cache-v1`;
const DATA_CACHE_NAME = `data-cache-v1`;

self.addEventListener(`install`, event => {
    //install steps for cahce files
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => cache.addAll(FILES_TO_CACHE))     
    );
});

//ativated the cache and waiting untile the request has been fullfilled
self.addEventListener(`activate`, event => {
    const currentCaches = [STATIC_CACHE, DATA_CACHE_NAME];
    event.waitUntil(caches
            .keys().then(cacheNames =
                cacheNames.filter(cacheName => !currentCaches.includes(cacheName))
            )
            //promise to delete all cache when needed
            .then(cachesToDelete =>
                Promise.all(
                    cachesToDelete.map(cacheToDelete => caches.delete(cacheToDelete))
                )
            )
            .then(() => self.clients.claim())
    );
});

//fetching the event with the correct url if not GET then retrn the method
self.addEventListener(`fetch`, event => {
    if (
        event.request.method !== `GET` ||
        !event.request.url.startsWith(self.location.origin)
    ) {
        event.respondWith(fetch(event.request));
        return;
    }
    //checking to see if the url is as below then caching the data
    if (event.request.url.includes(`/api/transaction`)) {
        event.respondWith(
            caches.open(DATA_CACHE_NAME).then(cache =>
                fetch(event.request)
                    .then(response => {
                        cache.put(event.request, response.clone());
                        return response;
                    })
                    .catch(() => caches.match(event.request))
            )
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }
//return cache even when offline, then put the in the req
            return caches
                .open(DATA_CACHE_NAME)
                .then(cache =>
                    fetch(event.request).then(response =>
                        cache.put(event.request, response.clone()).then(() => response)
                    )
                );
        })
    );
});