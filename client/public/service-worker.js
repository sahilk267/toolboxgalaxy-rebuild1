/* Toolbox Galaxy static PWA cache: app shell first, same-origin runtime assets opportunistically. */
const CACHE_NAME = "toolbox-galaxy-static-v3";
const APP_SHELL = ["/", "/offline.html", "/manifest.webmanifest", "/pdf.worker.min.mjs"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => { const copy = response.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)); return response; }).catch(async () => (await caches.match(request)) || (await caches.match("/")) || (await caches.match("/offline.html"))));
    return;
  }
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => { if (!response || response.status !== 200) return response; const copy = response.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)); return response; })));
});

/* Periodic Background Sync: triggers once-daily local puzzle reminder where supported */
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "daily-puzzle-reminder") {
    event.waitUntil(
      self.registration.showNotification("Daily Logic Puzzle Ready! 🧩", {
        body: "Today's fresh set of logic puzzles (Queens, Hive, Wordle & more) is ready to solve!",
        icon: "/orbit-mark.svg",
        badge: "/orbit-mark.svg",
        tag: "daily-puzzle-reminder",
        renotify: false,
        data: { url: "/games" },
      })
    );
  }
});

/* Handle click on reminder notification */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || "/games";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url && client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
