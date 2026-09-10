import { CROPS, type CropId } from "@/lib/data/catalog";
import { historyFor, type PricePoint } from "@/lib/data/series";
import { fitOls, predictRow, residualStd } from "./ols";

export interface ForecastPoint {
  date: string;
  predicted: number;
  lo: number;
  hi: number;
}

export interface SaleWindow {
  action: "sell_now" | "hold";
  holdDays: number;
  expectedUpliftPct: number;
  reason: string;
  peakDate: string;
  peakPrice: number;
}

export interface PriceModelResult {
  crop: CropId;
  method: "seasonal_lag_ols";
  trainedOn: string;
  nSamples: number;
  rmse: number;
  mape: number;
  current: number;
  forecast: ForecastPoint[];
  saleWindow: SaleWindow;
  featureWeights: { name: string; weight: number }[];
}

function doy(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
}

function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function features(hist: PricePoint[], t: number): number[] {
  const p = hist[t]!;
  const day = doy(p.date);
  return [
    1,
    Math.sin((2 * Math.PI * day) / 365),
    Math.cos((2 * Math.PI * day) / 365),
    hist[t - 1]!.modal,
    hist[t - 7]!.modal,
    hist[t - 14]!.modal,
    Math.log(hist[t]!.arrivals + 1),
  ];
}

const FEATURE_NAMES = [
  "intercept",
  "season_sin",
  "season_cos",
  "lag_1d",
  "lag_7d",
  "lag_14d",
  "log_arrivals",
];

export function runPriceModel(crop: CropId, horizon = 21): PriceModelResult {
  const hist = historyFor(crop);
  const X: number[][] = [];
  const y: number[] = [];
  for (let t = 14; t < hist.length - 1; t++) {
    X.push(features(hist, t));
    y.push(hist[t + 1]!.modal);
  }
  const beta = fitOls(X, y);
  const sigma = residualStd(X, y, beta);

  let se = 0;
  let ape = 0;
  for (let i = 0; i < y.length; i++) {
    const pred = predictRow(beta, X[i]!);
    se += (y[i]! - pred) ** 2;
    ape += Math.abs(y[i]! - pred) / Math.max(1, y[i]!);
  }
  const rmse = Math.sqrt(se / y.length);
  const mape = ape / y.length;

  const series = hist.map((h) => ({ ...h }));
  const last = series[series.length - 1]!;
  const forecast: ForecastPoint[] = [];
  for (let h = 1; h <= horizon; h++) {
    const t = series.length - 1;
    const x = features(series, t);
    const pred = Math.max(50, predictRow(beta, x));
    const date = addDays(last.date, h);
    const band = 1.28 * sigma * Math.sqrt(h); // ~80% interval, widening
    forecast.push({
      date,
      predicted: Math.round(pred),
      lo: Math.round(Math.max(50, pred - band)),
      hi: Math.round(pred + band),
    });
    series.push({
      date,
      modal: pred,
      arrivals: last.arrivals,
    });
  }

  const spec = CROPS[crop];
  const current = last.modal;
  let bestNet = current;
  let bestDay = 0;
  for (let d = 0; d <= Math.min(14, forecast.length); d++) {
    const price = d === 0 ? current : forecast[d - 1]!.predicted;
    const net = price * (1 - spec.storageCostPerDay * d);
    if (net > bestNet) {
      bestNet = net;
      bestDay = d;
    }
  }
  const peak = bestDay === 0 ? current : forecast[bestDay - 1]!.predicted;
  const uplift = ((bestNet - current) / current) * 100;
  const saleWindow: SaleWindow =
    bestDay === 0 || uplift < 1
      ? {
          action: "sell_now",
          holdDays: 0,
          expectedUpliftPct: 0,
          reason: spec.perishable
            ? "Forecast does not cover storage and spoilage cost. Sell into today's mandi."
            : "Near-term path is flat after holding cost. Realise the current modal.",
          peakDate: last.date,
          peakPrice: current,
        }
      : {
          action: "hold",
          holdDays: bestDay,
          expectedUpliftPct: Math.round(uplift * 10) / 10,
          reason: `Net of ~${(spec.storageCostPerDay * 100).toFixed(2)}%/day storage, the model peaks in ${bestDay} days.`,
          peakDate: forecast[bestDay - 1]!.date,
          peakPrice: peak,
        };

  return {
    crop,
    method: "seasonal_lag_ols",
    trainedOn: "Agmarknet-calibrated Maharashtra mandi series (pinned 8 Sep 2026 official modals)",
    nSamples: y.length,
    rmse: Math.round(rmse),
    mape: Math.round(mape * 1000) / 10,
    current,
    forecast,
    saleWindow,
    featureWeights: FEATURE_NAMES.map((name, i) => ({
      name,
      weight: Math.round(beta[i]! * 1000) / 1000,
    })),
  };
}
