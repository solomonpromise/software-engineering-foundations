import { useSyncExternalStore } from "react";

const KEY = "sf:grok-key";
const subs = new Set<() => void>();
const read = () => { try { return localStorage.getItem(KEY) ?? ""; } catch { return ""; } };

export function getGrokKey() { return typeof window === "undefined" ? "" : read(); }
export function setGrokKey(v: string) {
  const t = v.trim();
  if (t) localStorage.setItem(KEY, t); else localStorage.removeItem(KEY);
  subs.forEach((f) => f());
}
export function useGrokKey() {
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, read, () => "");
}
