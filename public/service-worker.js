/* Ministry Report service worker (P0 skeleton).
 *
 * Scope on purpose: it caches only the app shell's static files and an offline page.
 * It NEVER caches /admin, /app data, /auth, /platform, server actions or anything from Supabase, so personal data
 * cannot end up in a shared HTTP cache (PRD §14.7). Offline data (log, visits, drafts, sync queue) arrives in Phase 2
 * and will live in per-user IndexedDB, wiped on sign-out.
 */
const VERSION = "v2"; // bumped so the activate step clears the old page cache after this fix
const STATIC_CACHE = `mr-static-${VERSION}`;
const PAGE_CACHE = `mr-pages-${VERSION}`;
const PRECACHE = ["/offline", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon.svg"];
const PUBLIC_PAGES = new Set(["/", "/sw", "/privacy", "/terms", "/install", "/signin", "/request-access"]);
// Member app shell (D-29: dashboard, log, visits and drafts must keep working offline). A refresh while
// offline on any of these should reopen the last cached shell, not drop straight to the generic offline
// page — the client-side hooks (Dexie/IndexedDB) then take over for the actual data.
// /admin and /platform are deliberately excluded: admin tools are online-only.
const APP_PREFIX = "/app";
// Warmed on demand (message below), never at install: install can fire before anyone has signed in,
// and fetching these then would cache the sign-in redirect instead of the real page.
const APP_SHELL_ROUTES = ["/app", "/app/log", "/app/report", "/app/history", "/app/visits", "/app/notifications", "/app/settings"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

// Called once per sign-in (see register-sw.tsx) so every member-app route works offline immediately,
// not just the one or two a person happened to open first. Runs as real navigation-shaped requests so
// the results land in the same PAGE_CACHE the navigate handler below reads from.
self.addEventListener("message", (event) => {
  if (event.data?.type !== "WARM_APP_SHELL") return;
  event.waitUntil(
    caches.open(PAGE_CACHE).then((cache) =>
      Promise.all(
        APP_SHELL_ROUTES.map((path) =>
          fetch(path, { credentials: "same-origin" })
            .then((res) => { if (res.ok) return cache.put(path, res); })
            .catch(() => undefined),
        ),
      ),
    ),
  );
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

  // Public pages and the signed-in member app: network first, remember the last good copy for offline.
  // Everything else (/admin, /platform, auth callbacks, exports) stays network-only (D-29).
  if (req.mode === "navigate") {
    const isPublicPage = PUBLIC_PAGES.has(url.pathname);
    const isMemberApp = url.pathname === APP_PREFIX || url.pathname.startsWith(`${APP_PREFIX}/`);
    if (!isPublicPage && !isMemberApp) {
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
