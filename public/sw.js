// FinTrack Service Worker — enables offline access and PWA installability
const CACHE_NAME = "fintrack-v1";
const APP_SHELL = [
  "/",
  "/manifest.json",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/apple-touch-icon.png",
];

// Install: pre-cache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for API/navigations, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Network-first for navigation requests (HTML pages) — always serve fresh when online
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
    );
    return;
  }

  // Network-first for API calls — never cache API responses (data must be fresh)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request).catch(() => new Response("Offline", { status: 503 })));
    return;
  }

  // Cache-first for static assets (icons, fonts, _next/static)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Only cache successful responses
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});

// Allow the page to trigger immediate activation
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
