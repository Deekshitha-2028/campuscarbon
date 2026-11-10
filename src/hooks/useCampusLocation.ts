import { createLocalStore } from "@/lib/localStore";
import { DEFAULT_LOCATION_ID, getLocation, LOCATIONS } from "@/lib/locations";
import { useLocalStore } from "./useLocalStore";

export const locationStore = createLocalStore<string>("cc:location", DEFAULT_LOCATION_ID, (raw) =>
  typeof raw === "string" && LOCATIONS.some((l) => l.id === raw) ? raw : null,
);

export function useCampusLocation() {
  const id = useLocalStore(locationStore);
  return { location: getLocation(id), setLocationId: (next: string) => locationStore.set(next) };
}
