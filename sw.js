// Price It Right — offline cache (cache-first for this page)
var CACHE_NAME = "price-it-right-v1";
var URLS_TO_CACHE = [
  "./",
  "./index.html"
];

self.addEventListener("install", function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names
          .filter(function (name) { return name !== CACHE_NAME; })
          .map(function (name) { return caches.delete(name); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

// Cache-first for same-origin GET requests, so the calculator still opens
// with no internet after the first successful visit. Anything cross-origin
// (like the Google Fonts request) is left to the network as usual — if it
// fails offline, the page just falls back to its default fonts.
self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      var fetchPromise = fetch(event.request)
        .then(function (networkResponse) {
          if (networkResponse && networkResponse.ok) {
            var copy = networkResponse.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(event.request, copy);
            });
          }
          return networkResponse;
        })
        .catch(function () {
          return cached;
        });
      return cached || fetchPromise;
    })
  );
});
