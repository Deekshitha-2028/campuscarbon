export interface CampusLocation {
  id: string;
  name: string;
  district: string;
  lat: number;
  lon: number;
}

export const TIMEZONE = "Asia/Kolkata";

export const LOCATIONS: readonly CampusLocation[] = [
  { id: "tumakuru", name: "Tumakuru", district: "Tumakuru", lat: 13.3409, lon: 77.101 },
  { id: "bengaluru", name: "Bengaluru", district: "Bengaluru Urban", lat: 12.9716, lon: 77.5946 },
  { id: "mysuru", name: "Mysuru", district: "Mysuru", lat: 12.2958, lon: 76.6394 },
  { id: "hubballi", name: "Hubballi-Dharwad", district: "Dharwad", lat: 15.3647, lon: 75.124 },
  { id: "mangaluru", name: "Mangaluru", district: "Dakshina Kannada", lat: 12.9141, lon: 74.856 },
  { id: "belagavi", name: "Belagavi", district: "Belagavi", lat: 15.8497, lon: 74.4977 },
  { id: "kalaburagi", name: "Kalaburagi", district: "Kalaburagi", lat: 17.3297, lon: 76.8343 },
] as const;

export const DEFAULT_LOCATION_ID = "tumakuru";

export function getLocation(id: string | null | undefined): CampusLocation {
  return LOCATIONS.find((l) => l.id === id) ?? LOCATIONS[0]!;
}
