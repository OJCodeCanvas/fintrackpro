"use client";
export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })?.Capacitor?.isNativePlatform?.();
}
export async function localFetch(_path: string, _options?: RequestInit): Promise<Response | null> {
  return null;
}
