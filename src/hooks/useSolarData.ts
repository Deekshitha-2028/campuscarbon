import { queryOptions, useQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { getLocation } from "@/lib/locations";
import { fallbackSignal, fetchArchive, fetchForecast } from "@/lib/openMeteo";

const HOUR = 60 * 60 * 1000;

export function archiveQueryOptions(locationId: string) {
  const loc = getLocation(locationId);
  return queryOptions({
    queryKey: ["open-meteo", "archive", loc.id],
    queryFn: () => fetchArchive(loc),
    staleTime: 12 * HOUR,
    gcTime: 24 * HOUR,
    retry: 1,
  });
}

export function useArchive(locationId: string) {
  return useQuery(archiveQueryOptions(locationId));
}

export function useForecast(locationId: string) {
  const loc = getLocation(locationId);
  return useQuery({
    queryKey: ["open-meteo", "forecast", loc.id],
    queryFn: () => fetchForecast(loc),
    staleTime: 15 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
    retry: 1,
  });
}

/** Number of data sets currently served from the offline cache. */
export function useCacheFallbackCount(): number {
  return useSyncExternalStore(fallbackSignal.subscribe, fallbackSignal.getSnapshot, fallbackSignal.getServerSnapshot);
}

const subscribeOnline = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
}
