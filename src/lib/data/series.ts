import { CROPS, quotesForCrop, type CropId } from "./catalog";

export interface PricePoint {
  date: string;
  modal: number;
  arrivals: number;
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function seasonalFactor(doy: number, peakMonth: number, troughMonth: number) {
  const peak = ((peakMonth - 1) / 12) * 365;
  const trough = ((troughMonth - 1) / 12) * 365;
  const angle = ((doy - peak) / 365) * Math.PI * 2;
  const troughAngle = ((trough - peak) / 365) * Math.PI * 2;
  return 1 + 0.18 * Math.cos(angle) - 0.08 * Math.cos(troughAngle + angle / 2);
}

/** Two-year daily series ending on report date, pinned to today's official modal. */
export function buildHistory(crop: CropId, days = 540): PricePoint[] {
  const spec = CROPS[crop];
  const quotes = quotesForCrop(crop);
  const pin = quotes.length
    ? quotes.reduce((s, q) => s + q.modal, 0) / quotes.length
    : spec.todayStateAvg;

  const rng = mulberry32(crop.split("").reduce((s, c) => s + c.charCodeAt(0) * 13, 91));
  const end = new Date("2026-09-08T00:00:00+05:30");
  const raw: number[] = [];

  let price = pin * 0.92;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    const doy = Math.floor(
      (d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000,
    );
    const season = seasonalFactor(doy, spec.seasonalPeakMonth, spec.seasonalTroughMonth);
    const shock = (rng() - 0.5) * spec.volatility * 2;
    const meanRev = (pin * season - price) * 0.035;
    price = Math.max(spec.todayRange[0] * 0.6, price * (1 + shock) + meanRev);
    raw.push(price);
  }

  const last = raw[raw.length - 1]!;
  const scale = pin / last;
  return raw.map((p, i) => {
    const d = new Date(end);
    d.setDate(d.getDate() - (days - 1 - i));
    const arrivals = Math.round(80 + rng() * 420 * (0.7 + 0.6 * Math.sin(i / 18)));
    return {
      date: d.toISOString().slice(0, 10),
      modal: Math.round(p * scale),
      arrivals,
    };
  });
}

const cache = new Map<CropId, PricePoint[]>();
export function historyFor(crop: CropId) {
  let h = cache.get(crop);
  if (!h) {
    h = buildHistory(crop);
    cache.set(crop, h);
  }
  return h;
}
