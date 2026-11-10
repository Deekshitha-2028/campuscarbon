import { useSyncExternalStore } from "react";
import type { LocalStore } from "@/lib/localStore";

/** Subscribe to a localStorage store. Renders the server value first, then the saved value. */
export function useLocalStore<T>(store: LocalStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, () => store.serverValue);
}

const noop = () => () => {};
/** true after hydration on the client. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
