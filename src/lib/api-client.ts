"use client";

import { isNativeApp, localFetch } from "./local-api";

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  // When running as a native app (Capacitor), serve all requests from local
  // storage so the app works fully offline without a backend server.
  if (isNativeApp()) {
    const localRes = await localFetch(path, options);
    if (localRes) {
      if (!localRes.ok) {
        throw new Error((await localRes.json()).error || `Request failed with status ${localRes.status}`);
      }
      return localRes.json();
    }
    // If not handled locally, fall through to network (rare)
  }

  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

// Fetch wrapper for non-JSON responses (e.g. CSV export). Routes to local store
// when native, returns the standard Response otherwise.
export async function apiRequest(
  path: string,
  options?: RequestInit
): Promise<Response> {
  if (isNativeApp()) {
    const localRes = await localFetch(path, options);
    if (localRes) {
      // Wrap in a Response-like object for blob() calls
      const blob = localRes.blob ? await localRes.blob() : new Blob([await localRes.text()], { type: "application/json" });
      return new Response(blob, { status: localRes.status, ok: localRes.ok });
    }
  }
  return fetch(path, options);
}
