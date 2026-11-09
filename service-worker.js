/* 哼唱编曲台 · 离线缓存：装到主屏幕后没网也能打开 */
const CACHE = "hum-studio-v5";
const ASSETS = ["./", "./index.html", "./manifest.json?v=2", "./keys.js", "./icon-192.png?v=2", "./icon-512.png?v=2", "./apple-touch-icon.png?v=2", "./favicon-32.png?v=2",
  "./fonts/rubik-mono-one.woff2", "./fonts/vt323.woff2", "./fonts/jost.woff2"];
self.addEventListener("install", (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener("activate", (e) => e.waitUntil(caches.keys()
  .then((ks) => Promise.all(ks.filter((k) => k.startsWith("hum-studio-") && k !== CACHE).map((k) => caches.delete(k))))
  .then(() => self.clients.claim())));
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  /* 安卓在录音机 App 里「分享」到本应用：把文件先存起来，再打开页面去读 */
  if (e.request.method === "POST" && url.pathname.endsWith("/share-target")) {
    e.respondWith((async () => {
      const f = (await e.request.formData()).get("audio");
      if (f && f.size) {
        const c = await caches.open("hum-share");
        await c.put("./shared-audio", new Response(f, { headers: { "content-type": f.type || "audio/mp4", "x-name": encodeURIComponent(f.name || "分享的录音") } }));
      }
      return Response.redirect("./index.html?shared=1", 303);
    })());
    return;
  }
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  /* 先走网络（拿到最新版就顺手存一份），断网时用缓存 */
  e.respondWith(fetch(e.request).then((r) => {
    if (r.ok) { const c = r.clone(); caches.open(CACHE).then((x) => x.put(e.request.mode === "navigate" ? "./index.html" : e.request, c)); }
    return r;
  }).catch(() => caches.match(e.request.mode === "navigate" ? "./index.html" : e.request)));
});
