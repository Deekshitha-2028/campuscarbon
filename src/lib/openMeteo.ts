import { aggregateMonthly, last12CompleteMonths, type DailyWeather, type MonthlyRadiation } from "./calc";
import { TIMEZONE, type CampusLocation } from "./locations";

export const OPEN_METEO = {
  archive: "https://archive-api.open-meteo.com/v1/archive",
  forecast: "https://api.open-meteo.com/v1/forecast",
  site: "https://open-meteo.com",
  docs: "https://open-meteo.com/en/docs/historical-weather-api",
  licence: "CC BY 4.0",
} as const;

export interface ArchiveData {
  location: string;
  startDate: string;
  endDate: string;
  daily: DailyWeather[];
  monthly: MonthlyRadiation[];
}

export interface ForecastData {
  location: string;
  current: {
    time: string;
    irradianceWm2: number | null;
    cloudCover: number | null;
    temperature: number | null;
  };
  daily: { date: string; radiationKWhM2: number | null; isForecast: boolean }[];
  hourlyToday: { time: string; irradianceWm2: number | null; cloudCover: number | null; temperature: number | null }[];
}

export interface CachedResult<T> {
  data: T;
  fetchedAt: number; // epoch ms
  fromCache: boolean; // true when the network failed and we served the last saved copy
  error?: string;
}

/* ---------------- offline / fallback signal ---------------- */

const fallbackListeners = new Set<() => void>();
const fallbackKeys = new Set<string>();
let fallbackSnapshot = 0;

export const fallbackSignal = {
  subscribe(cb: () => void) {
    fallbackListeners.add(cb);
    return () => fallbackListeners.delete(cb);
  },
  getSnapshot: () => fallbackSnapshot,
  getServerSnapshot: () => 0,
  mark(key: string, on: boolean) {
    const had = fallbackKeys.has(key);
    if (on) fallbackKeys.add(key);
    else fallbackKeys.delete(key);
    if (had !== on) {
      fallbackSnapshot = fallbackKeys.size;
      fallbackListeners.forEach((l) => l());
    }
  },
};

/* ---------------- localStorage cache ---------------- */

const CACHE_PREFIX = "cc:om:";

function readCache<T>(key: string): { data: T; fetchedAt: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: T; fetchedAt: number };
    if (!parsed || typeof parsed.fetchedAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T, fetchedAt: number) {
  try {
    window.localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, fetchedAt }));
  } catch {
    /* quota exceeded: skip caching */
  }
}

export function getCachedFetchedAt(key: string): number | null {
  return readCache(key)?.fetchedAt ?? null;
}

async function withCache<T>(key: string, fetcher: () => Promise<T>): Promise<CachedResult<T>> {
  try {
    const data = await fetcher();
    const fetchedAt = Date.now();
    writeCache(key, data, fetchedAt);
    fallbackSignal.mark(key, false);
    return { data, fetchedAt, fromCache: false };
  } catch (err) {
    const cached = readCache<T>(key);
    const message = err instanceof Error ? err.message : "Network error";
    if (cached) {
      fallbackSignal.mark(key, true);
      return { data: cached.data, fetchedAt: cached.fetchedAt, fromCache: true, error: message };
    }
    throw new Error(`Could not reach Open-Meteo (${message}) and no saved copy is available.`);
  }
}

/* ---------------- fetchers ---------------- */

async function getJson(url: string): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as Record<string, unknown>;
    if (json && json.error) throw new Error(String(json.reason ?? "API error"));
    return json;
  } finally {
    clearTimeout(t);
  }
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

export function archiveUrl(loc: CampusLocation, startDate: string, endDate: string): string {
  const p = new URLSearchParams({
    latitude: String(loc.lat),
    longitude: String(loc.lon),
    start_date: startDate,
    end_date: endDate,
    daily: "shortwave_radiation_sum,sunshine_duration,cloud_cover_mean,temperature_2m_mean",
    timezone: TIMEZONE,
  });
  return `${OPEN_METEO.archive}?${p.toString()}`;
}

export function forecastUrl(loc: CampusLocation): string {
  const p = new URLSearchParams({
    latitude: String(loc.lat),
    longitude: String(loc.lon),
    daily: "shortwave_radiation_sum",
    hourly: "shortwave_radiation,cloud_cover,temperature_2m",
    current: "shortwave_radiation,cloud_cover,temperature_2m",
    past_days: "7",
    forecast_days: "7",
    timezone: TIMEZONE,
  });
  return `${OPEN_METEO.forecast}?${p.toString()}`;
}

export function parseArchive(json: Record<string, unknown>, loc: CampusLocation, startDate: string, endDate: string): ArchiveData {
  const d = (json.daily ?? {}) as Record<string, unknown>;
  const times = arr(d.time);
  const rad = arr(d.shortwave_radiation_sum);
  const sun = arr(d.sunshine_duration);
  const cloud = arr(d.cloud_cover_mean);
  const temp = arr(d.temperature_2m_mean);
  const daily: DailyWeather[] = times.map((t, i) => ({
    date: String(t),
    radiationMJ: num(rad[i]),
    sunshineSeconds: num(sun[i]),
    cloudCoverMean: num(cloud[i]),
    temperatureMean: num(temp[i]),
  }));
  if (daily.length === 0) throw new Error("Empty archive response");
  return { location: loc.id, startDate, endDate, daily, monthly: aggregateMonthly(daily) };
}

export async function fetchArchive(loc: CampusLocation, today = new Date()): Promise<CachedResult<ArchiveData>> {
  const { startDate, endDate } = last12CompleteMonths(today);
  return withCache(`archive:${loc.id}:${endDate}`, async () => {
    const json = await getJson(archiveUrl(loc, startDate, endDate));
    return parseArchive(json, loc, startDate, endDate);
  })
    .then((r) => {
      if (!r.fromCache) fallbackSignal.mark(`archive:${loc.id}`, false);
      return r;
    })
    .catch(async (err) => {
    // Fall back to any older archive cache for this location (e.g. last month's).
    const older = findAnyCache<ArchiveData>(`archive:${loc.id}:`);
    if (older) {
      fallbackSignal.mark(`archive:${loc.id}`, true);
      return { data: older.data, fetchedAt: older.fetchedAt, fromCache: true, error: String(err) };
    }
    throw err;
  });
}

function findAnyCache<T>(prefix: string): { data: T; fetchedAt: number } | null {
  if (typeof window === "undefined") return null;
  let best: { data: T; fetchedAt: number } | null = null;
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k || !k.startsWith(CACHE_PREFIX + prefix)) continue;
      const c = readCache<T>(k.slice(CACHE_PREFIX.length));
      if (c && (!best || c.fetchedAt > best.fetchedAt)) best = c;
    }
  } catch {
    return null;
  }
  return best;
}

export function parseForecast(json: Record<string, unknown>, loc: CampusLocation): ForecastData {
  const cur = (json.current ?? {}) as Record<string, unknown>;
  const d = (json.daily ?? {}) as Record<string, unknown>;
  const h = (json.hourly ?? {}) as Record<string, unknown>;
  const curTime = typeof cur.time === "string" ? cur.time : "";
  const today = curTime.slice(0, 10);
  const dTimes = arr(d.time);
  const dRad = arr(d.shortwave_radiation_sum);
  const hTimes = arr(h.time);
  const hRad = arr(h.shortwave_radiation);
  const hCloud = arr(h.cloud_cover);
  const hTemp = arr(h.temperature_2m);
  return {
    location: loc.id,
    current: {
      time: curTime,
      irradianceWm2: num(cur.shortwave_radiation),
      cloudCover: num(cur.cloud_cover),
      temperature: num(cur.temperature_2m),
    },
    daily: dTimes.map((t, i) => {
      const mj = num(dRad[i]);
      const date = String(t);
      return { date, radiationKWhM2: mj === null ? null : mj / 3.6, isForecast: today !== "" && date > today };
    }),
    hourlyToday: hTimes
      .map((t, i) => ({
        time: String(t),
        irradianceWm2: num(hRad[i]),
        cloudCover: num(hCloud[i]),
        temperature: num(hTemp[i]),
      }))
      .filter((r) => today !== "" && r.time.startsWith(today)),
  };
}

export async function fetchForecast(loc: CampusLocation): Promise<CachedResult<ForecastData>> {
  return withCache(`forecast:${loc.id}`, async () => {
    const json = await getJson(forecastUrl(loc));
    return parseForecast(json, loc);
  });
}
