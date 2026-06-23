"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Register in all environments so the PWA is installable during preview.
      // The SW uses network-first for navigations and API calls, so it won't
      // interfere with hot reload or serve stale data.
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.warn("SW registration failed:", err));
    }
  }, []);

  return null;
}
