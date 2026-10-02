// Service worker: makes the app installable and keeps static assets cached.
// Medical data is never cached here; it always comes fresh from Supabase.
const CACHE = "ositos-v2";
const ASSETS = ["/pets/amelia.jpg", "/pets/simona.jpg", "/pets/amelia-face.jpg", "/pets/simona-face.jpg", "/pets/amelia-paws.webp", "/pets/simona-paws.webp", "/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  // Static build assets and illustrations: cache first.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/pets/")) {
    e.respondWith(
      caches.match(e.request).then(
        (hit) =>
          hit ||
          fetch(e.request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
            return res;
          }),
      ),
    );
  }
});
