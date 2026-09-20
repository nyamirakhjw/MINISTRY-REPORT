/* Ministry Report service worker (P0 skeleton).
 *
 * Scope on purpose: it caches only the app shell's static files and an offline page.
 * It NEVER caches /admin, /app data, /auth, /platform, server actions or anything from Supabase, so personal data
 * cannot end up in a shared HTTP cache (PRD §14.7). Offline data (log, visits, drafts, sync queue) arrives in Phase 2
 * and will live in per-user IndexedDB, wiped on sign-out.
 */
const VERSION = "v1";
const STATIC_CACHE = `mr-static-${VERSION}`;
const PAGE_CACHE = `mr-pages-${VERSION}`;
const PRECACHE = ["/offline", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon.svg"];
const PUBLIC_PAGES = new Set(["/", "/sw", "/privacy", "/terms", "/install", "/signin", "/request-access"]);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => ![STATIC_CACHE, PAGE_CACHE].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase and everything else: network only

  // Hashed build assets and icons: cache first.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
        return res;
      })),
    );
    return;
  }

  // Public pages: network first, remember the last good copy for offline.
  if (req.mode === "navigate") {
    if (!PUBLIC_PAGES.has(url.pathname)) {
      event.respondWith(fetch(req).catch(() => caches.match("/offline")));
      return;
    }
    event.respondWith(
      fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(PAGE_CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req).then((hit) => hit || caches.match("/offline"))),
    );
  }
});
