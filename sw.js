const CACHE = "3zbh-shell-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./icon.svg",
  "./manifest.webmanifest",
  "./assets/fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2",
  "./assets/fonts/ibm-plex-sans-arabic-arabic-500-normal.woff2",
  "./assets/fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2",
  "./assets/fonts/ibm-plex-sans-arabic-arabic-700-normal.woff2",
];
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("3zbh-shell-") && k !== CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
// Prefer fresh files online; the last verified shell remains available offline.
self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    new URL(event.request.url).origin !== self.location.origin
  )
    return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(
        async () =>
          (await caches.match(event.request)) ||
          (event.request.mode === "navigate"
            ? await caches.match("./index.html")
            : Response.error()),
      ),
  );
});
