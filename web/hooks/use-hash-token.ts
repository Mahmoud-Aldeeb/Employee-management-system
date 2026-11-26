import { useSyncExternalStore } from "react";
import { readTokenFromHash } from "@/lib/url-token";

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

export function useHashToken(): string | null {
  return useSyncExternalStore<string | null>(
    subscribe,
    () => readTokenFromHash(window.location.hash),
    () => null,
  );
}
