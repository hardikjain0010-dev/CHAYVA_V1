/**
 * Arthyne PWA Service Worker
 * Version: 1.0.0
 *
 * Provides app shell and static asset caching while strictly bypassing
 * all private API requests and sensitive user financial data.
 */

const CACHE_NAME = "arthyne-cache-v1.0.0";

// Static assets and shell to pre-cache on install
const PRECACHE_ASSETS = [
  "/",
  "/manifest.json",
  "/logo.png",
  "/arthyne-logo.png",
  "/favicon.png",
  "/pwa-192x192.png",
  "/pwa-512x512.png",
  "/pwa-maskable-512x512.png",
  "/apple-touch-icon.png",
];

// Domains/patterns that must NEVER be cached by the service worker
const EXCLUDED_HOSTS = [
  "arthyne-backend.onrender.com",
  "chayva-backend.onrender.com",
  "identitytoolkit.googleapis.com",
  "securetoken.googleapis.com",
  "firestore.googleapis.com",
];

const EXCLUDED_PATH_PREFIXES = [
  "/auth",
  "/expenses",
  "/insights",
  "/nudges",
  "/profile",
  "/moods",
  "/sms",
  "/webhook",
  "/voice",
  "/dna",
  "/api",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn("[SW] Pre-cache warning:", err);
      }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Never intercept non-GET requests (POST, PUT, DELETE, PATCH, etc.)
  if (request.method !== "GET") {
    return;
  }

  // 2. Never cache private/authenticated API backend requests
  if (
    EXCLUDED_HOSTS.some((host) => url.hostname.includes(host)) ||
    EXCLUDED_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))
  ) {
    return;
  }

  // 3. For HTML navigation requests: Network-first, fallback to cached app shell
  if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const rootCached = await caches.match("/");
          if (rootCached) return rootCached;
          return new Response(
            `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Arthyne - Offline</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#FAFAFE;color:#18181B;text-align:center;padding:20px;"><div><h1 style="font-size:1.5rem;font-weight:700;">You're Offline</h1><p style="color:#71717A;font-size:0.9rem;">Please check your internet connection to access Arthyne.</p></div></body></html>`,
            { headers: { "Content-Type": "text/html" } },
          );
        }),
    );
    return;
  }

  // 4. For Static Assets (JS, CSS, images, fonts, icons): Stale-while-revalidate / Cache-first
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/assets/") ||
      url.pathname.endsWith(".js") ||
      url.pathname.endsWith(".css") ||
      url.pathname.endsWith(".png") ||
      url.pathname.endsWith(".svg") ||
      url.pathname.endsWith(".woff2") ||
      url.pathname.endsWith(".woff"))
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      }),
    );
    return;
  }
});
