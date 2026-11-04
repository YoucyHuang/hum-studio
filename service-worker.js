/* 哼唱编曲台 · 离线缓存：装到主屏幕后没网也能打开 */
const CACHE = "hum-studio-v1";
const ASSETS = ["./", "./index.html", "./manifest.json", "./keys.js", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "./favicon-32.png"];
self.addEventListener("install", (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener("activate", (e) => e.waitUntil(caches.keys()
  .then((ks) => Promise.all(ks.filter((k) => k.startsWith("hum-studio-") && k !== CACHE).map((k) => caches.delete(k))))
  .then(() => self.clients.claim())));
/* 先走网络（拿到最新版就顺手存一份），断网时用缓存 */
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(fetch(e.request).then((r) => {
    if (r.ok) { const c = r.clone(); caches.open(CACHE).then((x) => x.put(e.request.mode === "navigate" ? "./index.html" : e.request, c)); }
    return r;
  }).catch(() => caches.match(e.request.mode === "navigate" ? "./index.html" : e.request)));
});
