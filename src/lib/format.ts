const nf = (max: number, min = 0) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: max, minimumFractionDigits: min });

const cache = new Map<string, Intl.NumberFormat>();
function fmt(max: number, min = 0) {
  const k = `${max}:${min}`;
  let f = cache.get(k);
  if (!f) {
    f = nf(max, min);
    cache.set(k, f);
  }
  return f;
}

/** Format a number for display; never renders NaN. */
export function num(v: number | null | undefined, digits = 0, fallback = "—"): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return fallback;
  return fmt(digits).format(v);
}

export function fixed(v: number | null | undefined, digits: number, fallback = "—"): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return fallback;
  return fmt(digits, digits).format(v);
}

export function tonnes(kg: number | null | undefined, digits = 1): string {
  if (kg === null || kg === undefined || !Number.isFinite(kg)) return "—";
  return fixed(kg / 1000, digits);
}

export function pct(v: number | null | undefined, digits = 1): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return `${fixed(v, digits)}%`;
}

export function dateTime(ms: number | null | undefined): string {
  if (!ms || !Number.isFinite(ms)) return "—";
  return new Date(ms).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

export function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
