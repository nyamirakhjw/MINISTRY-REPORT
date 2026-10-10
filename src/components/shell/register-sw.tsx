"use client";
import { useEffect } from "react";

/** Registers the service worker in production only, so development stays predictable. */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/service-worker.js", { scope: "/" }).catch(() => undefined);
  }, []);
  return null;
}
