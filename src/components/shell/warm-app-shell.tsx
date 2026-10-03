"use client";
import { useEffect } from "react";

/**
 * Renders nothing. Mounted once inside MemberShell (so it only runs for signed-in members, never on the
 * public site where /app would 302 to sign-in). Tells the already-registered service worker to fetch and
 * cache every member-app route, so Log, Report, History, Notifications and Settings work offline the first
 * time they're opened too — not only the one or two pages a person happened to visit first.
 */
export function WarmAppShell() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || navigator.onLine === false) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.active?.postMessage({ type: "WARM_APP_SHELL" }))
      .catch(() => undefined);
  }, []);
  return null;
}
