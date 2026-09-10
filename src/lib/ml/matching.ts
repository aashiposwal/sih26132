/**
 * SIH26132 matching engine — port of Pair B sample_engine + learned logistic weights.
 * Coefficients from train_matching_model.py (synthetic_v1, documented as such).
 */

export const LEARNED_WEIGHTS = {
  intercept: -2.6026430053477996,
  weights: {
    price: 2.909187170491583,
    distance: 2.377584690259019,
    quality: 1.3431760983460441,
    reliability: 1.0669209230404317,
  },
  trainedOn: "synthetic_v1",
  nSamples: 2000,
  metrics: { accuracy: 0.825, logLoss: 0.399, rocAuc: 0.841 },
} as const;

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface BuyerStats {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  completed: number;
  disputes: number;
  kyc: "VERIFIED" | "PENDING" | "NOT_SUBMITTED";
  rating: number;
}

export interface MatchInput {
  lot: { id: string; lat: number; lng: number; grade: "A" | "B" | "C"; listingPrice: number };
  offer: { id: string; buyerId: string; offerPrice: number; requiredGrade: "A" | "B" | "C" };
  buyer: BuyerStats;
  marketPrice: number;
}

export interface MatchResult {
  buyerId: string;
  offerId: string;
  totalScore: number;
  acceptProbability: number;
  breakdown: {
    priceFit: number;
    distanceFit: number;
    distanceKm: number;
    qualityFit: number;
    reliability: number;
  };
  explanation: string;
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

export function haversineKm(a: GeoPoint, b: GeoPoint) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const q =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q));
}

export function priceFitScore(offerPrice: number, marketPrice: number) {
  if (!marketPrice || marketPrice <= 0) return 0.5;
  const ratio = offerPrice / marketPrice;
  if (ratio >= 1) return 1;
  const floor = 0.7;
  return clamp01((ratio - floor) / (1 - floor));
}

export function distanceScore(a: GeoPoint, b: GeoPoint, maxKm = 150) {
  const km = haversineKm(a, b);
  return { score: clamp01(1 - km / maxKm), km: Math.round(km) };
}

const GRADE_RANK = { A: 3, B: 2, C: 1 };

export function qualityMatchScore(lotGrade: "A" | "B" | "C", required: "A" | "B" | "C") {
  const diff = Math.abs(GRADE_RANK[lotGrade] - GRADE_RANK[required]);
  if (diff === 0) return 1;
  if (diff === 1) return 0.5;
  return 0;
}

export function reliabilityScore(buyer: BuyerStats) {
  return clamp01(buyer.completed / (buyer.completed + buyer.disputes * 3 + 1));
}

function sigmoid(z: number) {
  return 1 / (1 + Math.exp(-z));
}

function explain(price: number, dist: number, km: number, quality: number, rel: number) {
  const parts: string[] = [];
  if (price >= 0.8) parts.push("strong price match");
  else if (price < 0.4) parts.push("price below market");
  if (dist >= 0.7) parts.push(`nearby (${km} km)`);
  else if (dist < 0.3) parts.push(`far (${km} km)`);
  if (quality === 1) parts.push("exact grade match");
  if (rel >= 0.7) parts.push("reliable buyer");
  return parts.length ? parts.join(", ") : "moderate overall fit";
}

export function scoreMatch(input: MatchInput): MatchResult {
  const price = priceFitScore(input.offer.offerPrice, input.marketPrice);
  const { score: dist, km } = distanceScore(input.lot, input.buyer);
  const quality = qualityMatchScore(input.lot.grade, input.offer.requiredGrade);
  const rel = reliabilityScore(input.buyer);
  const w = LEARNED_WEIGHTS.weights;
  const logit =
    LEARNED_WEIGHTS.intercept +
    w.price * price +
    w.distance * dist +
    w.quality * quality +
    w.reliability * rel;
  const p = sigmoid(logit);
  return {
    buyerId: input.buyer.id,
    offerId: input.offer.id,
    totalScore: Math.round(p * 1000) / 10,
    acceptProbability: Math.round(p * 1000) / 10,
    breakdown: {
      priceFit: Math.round(price * 100) / 100,
      distanceFit: Math.round(dist * 100) / 100,
      distanceKm: km,
      qualityFit: Math.round(quality * 100) / 100,
      reliability: Math.round(rel * 100) / 100,
    },
    explanation: explain(price, dist, km, quality, rel),
  };
}

export function rankOffers(inputs: MatchInput[]) {
  return inputs.map(scoreMatch).sort((a, b) => b.totalScore - a.totalScore);
}
