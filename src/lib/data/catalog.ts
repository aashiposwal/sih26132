export type CropId =
  | "onion"
  | "tomato"
  | "soybean"
  | "wheat"
  | "tur"
  | "cotton"
  | "grapes"
  | "pomegranate"
  | "jowar"
  | "potato";

export type Grade = "A" | "B" | "C";

export interface Mandi {
  id: string;
  name: string;
  district: string;
  lat: number;
  lng: number;
}

export interface CropSpec {
  id: CropId;
  name: string;
  unit: string;
  perishable: boolean;
  storageCostPerDay: number;
  seasonalPeakMonth: number;
  seasonalTroughMonth: number;
  /** Calibrated to Agmarknet / data.gov.in via MandiPulse, 8 Sep 2026 */
  todayStateAvg: number;
  todayRange: [number, number];
  reportingMandis: number;
  volatility: number;
}

export const MANDIS: Mandi[] = [
  { id: "lasalgaon", name: "Lasalgaon (Niphad)", district: "Nashik", lat: 20.146, lng: 74.233 },
  { id: "pimpalgaon", name: "Pimpalgaon Baswant", district: "Nashik", lat: 20.167, lng: 73.992 },
  { id: "nashik", name: "APMC Nashik", district: "Nashik", lat: 19.997, lng: 73.79 },
  { id: "pune", name: "APMC Pune (Market Yard)", district: "Pune", lat: 18.501, lng: 73.863 },
  { id: "mumbai", name: "Mumbai Onion & Potato Market", district: "Mumbai", lat: 19.076, lng: 72.878 },
  { id: "nagpur", name: "APMC Nagpur", district: "Nagpur", lat: 21.146, lng: 79.088 },
  { id: "latur", name: "APMC Latur", district: "Latur", lat: 18.409, lng: 76.56 },
  { id: "akola", name: "APMC Akola", district: "Akola", lat: 20.7, lng: 77.008 },
  { id: "yavatmal", name: "APMC Yavatmal", district: "Yavatmal", lat: 20.389, lng: 78.121 },
  { id: "solapur", name: "APMC Solapur", district: "Solapur", lat: 17.66, lng: 75.906 },
  { id: "sangli", name: "APMC Sangli", district: "Sangli", lat: 16.852, lng: 74.581 },
  { id: "beed", name: "APMC Beed", district: "Beed", lat: 18.989, lng: 75.756 },
  { id: "jalgaon", name: "APMC Jalgaon", district: "Jalgaon", lat: 21.008, lng: 75.563 },
  { id: "csn", name: "APMC Chhatrapati Sambhajinagar", district: "CSN", lat: 19.876, lng: 75.343 },
  { id: "karad", name: "APMC Karad", district: "Satara", lat: 17.289, lng: 74.182 },
];

export const CROPS: Record<CropId, CropSpec> = {
  onion: {
    id: "onion",
    name: "Onion",
    unit: "₹/qtl",
    perishable: true,
    storageCostPerDay: 0.0035,
    seasonalPeakMonth: 8,
    seasonalTroughMonth: 1,
    todayStateAvg: 3962,
    todayRange: [500, 6470],
    reportingMandis: 28,
    volatility: 0.045,
  },
  tomato: {
    id: "tomato",
    name: "Tomato",
    unit: "₹/qtl",
    perishable: true,
    storageCostPerDay: 0.012,
    seasonalPeakMonth: 7,
    seasonalTroughMonth: 2,
    todayStateAvg: 1540,
    todayRange: [200, 3250],
    reportingMandis: 27,
    volatility: 0.08,
  },
  soybean: {
    id: "soybean",
    name: "Soybean",
    unit: "₹/qtl",
    perishable: false,
    storageCostPerDay: 0.0008,
    seasonalPeakMonth: 6,
    seasonalTroughMonth: 11,
    todayStateAvg: 5717,
    todayRange: [4000, 6180],
    reportingMandis: 23,
    volatility: 0.018,
  },
  wheat: {
    id: "wheat",
    name: "Wheat",
    unit: "₹/qtl",
    perishable: false,
    storageCostPerDay: 0.0006,
    seasonalPeakMonth: 9,
    seasonalTroughMonth: 4,
    todayStateAvg: 2691,
    todayRange: [1850, 5500],
    reportingMandis: 66,
    volatility: 0.015,
  },
  tur: {
    id: "tur",
    name: "Tur (Arhar)",
    unit: "₹/qtl",
    perishable: false,
    storageCostPerDay: 0.0007,
    seasonalPeakMonth: 8,
    seasonalTroughMonth: 2,
    todayStateAvg: 7978,
    todayRange: [4000, 11200],
    reportingMandis: 45,
    volatility: 0.022,
  },
  cotton: {
    id: "cotton",
    name: "Cotton (Kapas)",
    unit: "₹/qtl",
    perishable: false,
    storageCostPerDay: 0.0009,
    seasonalPeakMonth: 5,
    seasonalTroughMonth: 11,
    todayStateAvg: 6850,
    todayRange: [5400, 7800],
    reportingMandis: 18,
    volatility: 0.02,
  },
  grapes: {
    id: "grapes",
    name: "Grapes",
    unit: "₹/qtl",
    perishable: true,
    storageCostPerDay: 0.01,
    seasonalPeakMonth: 3,
    seasonalTroughMonth: 8,
    todayStateAvg: 4200,
    todayRange: [1800, 9000],
    reportingMandis: 12,
    volatility: 0.05,
  },
  pomegranate: {
    id: "pomegranate",
    name: "Pomegranate",
    unit: "₹/qtl",
    perishable: true,
    storageCostPerDay: 0.006,
    seasonalPeakMonth: 1,
    seasonalTroughMonth: 6,
    todayStateAvg: 7800,
    todayRange: [4000, 14000],
    reportingMandis: 9,
    volatility: 0.04,
  },
  jowar: {
    id: "jowar",
    name: "Jowar (Sorghum)",
    unit: "₹/qtl",
    perishable: false,
    storageCostPerDay: 0.0007,
    seasonalPeakMonth: 8,
    seasonalTroughMonth: 12,
    todayStateAvg: 2450,
    todayRange: [1800, 3400],
    reportingMandis: 22,
    volatility: 0.016,
  },
  potato: {
    id: "potato",
    name: "Potato",
    unit: "₹/qtl",
    perishable: true,
    storageCostPerDay: 0.004,
    seasonalPeakMonth: 9,
    seasonalTroughMonth: 3,
    todayStateAvg: 1680,
    todayRange: [600, 2800],
    reportingMandis: 16,
    volatility: 0.04,
  },
};

/** Snapshot of 8 Sep 2026 official mandi rows (Agmarknet via data.gov.in). */
export interface MandiQuote {
  mandiId: string;
  crop: CropId;
  variety: string;
  min: number;
  modal: number;
  max: number;
}

export const TODAY_QUOTES: MandiQuote[] = [
  { mandiId: "nagpur", crop: "onion", variety: "White", min: 4500, modal: 5250, max: 5500 },
  { mandiId: "karad", crop: "onion", variety: "Halva", min: 1500, modal: 5000, max: 5000 },
  { mandiId: "pimpalgaon", crop: "onion", variety: "Unhali", min: 1700, modal: 4725, max: 6470 },
  { mandiId: "lasalgaon", crop: "onion", variety: "Unhali", min: 1200, modal: 4600, max: 4810 },
  { mandiId: "nashik", crop: "onion", variety: "Unhali", min: 1300, modal: 4450, max: 4721 },
  { mandiId: "mumbai", crop: "onion", variety: "Other", min: 3600, modal: 4200, max: 4800 },
  { mandiId: "akola", crop: "onion", variety: "Other", min: 2000, modal: 3500, max: 5200 },
  { mandiId: "pune", crop: "onion", variety: "Local", min: 800, modal: 1350, max: 2200 },
  { mandiId: "csn", crop: "onion", variety: "Other", min: 2300, modal: 3650, max: 5000 },

  { mandiId: "nagpur", crop: "tomato", variety: "Local", min: 2000, modal: 2525, max: 2700 },
  { mandiId: "mumbai", crop: "tomato", variety: "Local", min: 2000, modal: 2250, max: 2500 },
  { mandiId: "nashik", crop: "tomato", variety: "Local", min: 1800, modal: 1900, max: 2000 },
  { mandiId: "pune", crop: "tomato", variety: "Local", min: 1800, modal: 1800, max: 1800 },
  { mandiId: "sangli", crop: "tomato", variety: "Local", min: 1500, modal: 1800, max: 2500 },
  { mandiId: "karad", crop: "tomato", variety: "Local", min: 1500, modal: 1750, max: 2000 },

  { mandiId: "latur", crop: "soybean", variety: "Yellow", min: 6091, modal: 6150, max: 6180 },
  { mandiId: "beed", crop: "soybean", variety: "Yellow", min: 6011, modal: 6011, max: 6011 },
  { mandiId: "sangli", crop: "soybean", variety: "Yellow", min: 5850, modal: 5980, max: 6140 },
  { mandiId: "yavatmal", crop: "soybean", variety: "Yellow", min: 5875, modal: 5875, max: 5900 },
  { mandiId: "akola", crop: "soybean", variety: "Yellow", min: 5500, modal: 5850, max: 6025 },

  { mandiId: "mumbai", crop: "wheat", variety: "Local", min: 2900, modal: 4200, max: 5500 },
  { mandiId: "sangli", crop: "wheat", variety: "Local", min: 3950, modal: 4060, max: 4200 },
  { mandiId: "solapur", crop: "wheat", variety: "Local", min: 2660, modal: 3650, max: 4180 },
  { mandiId: "nagpur", crop: "wheat", variety: "Local", min: 3200, modal: 3425, max: 3500 },

  { mandiId: "beed", crop: "tur", variety: "Whole", min: 8600, modal: 9351, max: 11200 },
  { mandiId: "latur", crop: "tur", variety: "Whole", min: 8000, modal: 8940, max: 9050 },
  { mandiId: "akola", crop: "tur", variety: "Whole", min: 8220, modal: 8885, max: 8885 },
  { mandiId: "solapur", crop: "tur", variety: "Whole", min: 8000, modal: 8643, max: 9280 },
  { mandiId: "yavatmal", crop: "tur", variety: "Whole", min: 8490, modal: 8575, max: 8600 },
];

export const REPORT_DATE = "8 September 2026";
export const DATA_SOURCE =
  "Agmarknet / Directorate of Marketing & Inspection, via Open Government Data (data.gov.in)";

export function mandiById(id: string) {
  return MANDIS.find((m) => m.id === id);
}

export function quotesForCrop(crop: CropId) {
  return TODAY_QUOTES.filter((q) => q.crop === crop);
}
