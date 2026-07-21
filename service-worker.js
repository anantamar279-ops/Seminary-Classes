// OneSignal merges into this same service worker (rather than registering
// its own OneSignalSDKWorker.js) — see the serviceWorkerPath/serviceWorkerParam
// config passed to OneSignal.init() in app.js.
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

const CACHE_NAME = "seminary-classes-v2";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/seminary.png",
  "/assets/seminary.png"
];
const AUTH_PATH_PATTERN = /\/(api|auth|login|logout|session|token)\b/i;

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => undefined)
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isAuthRequest = AUTH_PATH_PATTERN.test(url.pathname) || request.headers.has("authorization");

  if (isAuthRequest) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status === 401 || response.status === 403 || response.type === "opaque") {
          return response;
        }

        const responseCopy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy));
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/index.html")))
  );
});

// NOTE: push and notificationclick events for real push delivery are now
// handled by OneSignal's own listeners, registered automatically via the
// importScripts() call above. Adding our own "push"/"notificationclick"
// listeners here would cause every OneSignal push to fire twice (once from
// each listener), so those custom handlers were removed in favor of
// OneSignal's built-in ones. Locally-triggered notifications (e.g. the
// instant toast for the admin who just posted a notice) go through
// registration.showNotification() directly from app.js and don't touch
// the "push" event at all, so they're unaffected.