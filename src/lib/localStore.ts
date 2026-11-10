/**
 * Tiny localStorage-backed store with change subscriptions.
 * Safe on the server (returns the fallback) and caches parsed values by raw string,
 * so useSyncExternalStore gets a stable snapshot.
 */
export interface LocalStore<T> {
  key: string;
  get: () => T;
  set: (value: T | ((prev: T) => T)) => void;
  clear: () => void;
  subscribe: (cb: () => void) => () => void;
  serverValue: T;
}

export function createLocalStore<T>(
  key: string,
  fallback: T,
  parse: (raw: unknown) => T | null = (raw) => raw as T,
): LocalStore<T> {
  const listeners = new Set<() => void>();
  let lastRaw: string | null | undefined;
  let lastValue: T = fallback;

  const read = (): T => {
    if (typeof window === "undefined") return fallback;
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      return fallback;
    }
    if (raw === lastRaw) return lastValue;
    lastRaw = raw;
    if (raw === null) {
      lastValue = fallback;
      return lastValue;
    }
    try {
      lastValue = parse(JSON.parse(raw)) ?? fallback;
    } catch {
      lastValue = fallback;
    }
    return lastValue;
  };

  const emit = () => listeners.forEach((l) => l());

  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key === key) emit();
    });
  }

  return {
    key,
    serverValue: fallback,
    get: read,
    set: (value) => {
      const next = typeof value === "function" ? (value as (p: T) => T)(read()) : value;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* storage full or blocked: keep in memory only */
        lastRaw = JSON.stringify(next);
        lastValue = next;
      }
      emit();
    },
    clear: () => {
      try {
        window.localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
      emit();
    },
    subscribe: (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}
