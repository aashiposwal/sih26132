import { create } from "zustand";
import type { CropId, Grade } from "./data/catalog";
import { MANDIS } from "./data/catalog";
import type { BuyerStats } from "./ml/matching";

export type Role = "farmer" | "buyer" | "official";

export interface Listing {
  id: string;
  farmerName: string;
  crop: CropId;
  variety: string;
  grade: Grade;
  quantity: number;
  price: number;
  mandiId: string;
  district: string;
  lat: number;
  lng: number;
  active: boolean;
  createdAt: string;
}

export interface Offer {
  id: string;
  listingId: string;
  buyerId: string;
  quantity: number;
  offeredPrice: number;
  requiredGrade: Grade;
  status: "PLACED" | "ACCEPTED" | "REJECTED" | "IN_TRANSIT" | "DELIVERED";
  matchScore?: number;
  explanation?: string;
  priceLock?: Record<string, string>;
  createdAt: string;
}

export const BUYERS: BuyerStats[] = [
  {
    id: "b-western",
    name: "Western MH Traders",
    type: "WHOLESALER",
    lat: 18.52,
    lng: 73.856,
    completed: 42,
    disputes: 1,
    kyc: "VERIFIED",
    rating: 4.6,
  },
  {
    id: "b-lasalgaon",
    name: "Lasalgaon Commission House",
    type: "MANDI_TRADER",
    lat: 20.15,
    lng: 74.24,
    completed: 88,
    disputes: 4,
    kyc: "VERIFIED",
    rating: 4.3,
  },
  {
    id: "b-export",
    name: "Konkan Fresh Exports",
    type: "EXPORTER",
    lat: 19.07,
    lng: 72.88,
    completed: 19,
    disputes: 0,
    kyc: "VERIFIED",
    rating: 4.8,
  },
  {
    id: "b-fpo",
    name: "Nashik FPO Aggregation",
    type: "FPO",
    lat: 20.01,
    lng: 73.79,
    completed: 11,
    disputes: 0,
    kyc: "VERIFIED",
    rating: 4.1,
  },
  {
    id: "b-processor",
    name: "Vidarbha Foods Pvt Ltd",
    type: "PROCESSOR",
    lat: 21.14,
    lng: 79.08,
    completed: 7,
    disputes: 2,
    kyc: "PENDING",
    rating: 3.6,
  },
];

const SEED_LISTINGS: Listing[] = [
  {
    id: "L-101",
    farmerName: "Savita Patil",
    crop: "onion",
    variety: "Unhali",
    grade: "A",
    quantity: 48,
    price: 4550,
    mandiId: "lasalgaon",
    district: "Nashik",
    lat: 20.146,
    lng: 74.233,
    active: true,
    createdAt: "2026-09-07T08:00:00+05:30",
  },
  {
    id: "L-102",
    farmerName: "Ramesh Jadhav",
    crop: "onion",
    variety: "Red",
    grade: "B",
    quantity: 30,
    price: 4100,
    mandiId: "pimpalgaon",
    district: "Nashik",
    lat: 20.167,
    lng: 73.992,
    active: true,
    createdAt: "2026-09-07T09:20:00+05:30",
  },
  {
    id: "L-103",
    farmerName: "Meena Shinde",
    crop: "tomato",
    variety: "Local",
    grade: "A",
    quantity: 12,
    price: 1750,
    mandiId: "pune",
    district: "Pune",
    lat: 18.501,
    lng: 73.863,
    active: true,
    createdAt: "2026-09-08T06:40:00+05:30",
  },
  {
    id: "L-104",
    farmerName: "Anil Kale",
    crop: "soybean",
    variety: "Yellow",
    grade: "A",
    quantity: 80,
    price: 6080,
    mandiId: "latur",
    district: "Latur",
    lat: 18.409,
    lng: 76.56,
    active: true,
    createdAt: "2026-09-06T11:00:00+05:30",
  },
  {
    id: "L-105",
    farmerName: "Sunita More",
    crop: "tur",
    variety: "Whole",
    grade: "A",
    quantity: 22,
    price: 8800,
    mandiId: "akola",
    district: "Akola",
    lat: 20.7,
    lng: 77.008,
    active: true,
    createdAt: "2026-09-05T14:10:00+05:30",
  },
];

const SEED_OFFERS: Offer[] = [
  {
    id: "O-1",
    listingId: "L-101",
    buyerId: "b-lasalgaon",
    quantity: 48,
    offeredPrice: 4620,
    requiredGrade: "A",
    status: "PLACED",
    createdAt: "2026-09-08T10:12:00+05:30",
  },
  {
    id: "O-2",
    listingId: "L-101",
    buyerId: "b-western",
    quantity: 40,
    offeredPrice: 4480,
    requiredGrade: "A",
    status: "PLACED",
    createdAt: "2026-09-08T11:05:00+05:30",
  },
  {
    id: "O-3",
    listingId: "L-101",
    buyerId: "b-export",
    quantity: 48,
    offeredPrice: 4700,
    requiredGrade: "A",
    status: "PLACED",
    createdAt: "2026-09-08T12:40:00+05:30",
  },
  {
    id: "O-4",
    listingId: "L-101",
    buyerId: "b-fpo",
    quantity: 20,
    offeredPrice: 4300,
    requiredGrade: "B",
    status: "PLACED",
    createdAt: "2026-09-08T13:00:00+05:30",
  },
];

interface AppState {
  role: Role;
  activeBuyerId: string;
  listings: Listing[];
  offers: Offer[];
  setRole: (r: Role) => void;
  setBuyer: (id: string) => void;
  addListing: (l: Omit<Listing, "id" | "createdAt" | "active" | "district" | "lat" | "lng">) => Listing;
  addOffer: (o: Omit<Offer, "id" | "createdAt" | "status">) => Offer;
  updateOffer: (id: string, patch: Partial<Offer>) => void;
}

export const useApp = create<AppState>()((set, get) => ({
  role: "farmer",
  activeBuyerId: "b-western",
  listings: SEED_LISTINGS,
  offers: SEED_OFFERS,
  setRole: (role) => set({ role }),
  setBuyer: (activeBuyerId) => set({ activeBuyerId }),
  addListing: (input) => {
    const mandi = MANDIS.find((m) => m.id === input.mandiId)!;
    const listing: Listing = {
      ...input,
      id: `L-${Date.now()}`,
      district: mandi.district,
      lat: mandi.lat,
      lng: mandi.lng,
      active: true,
      createdAt: new Date().toISOString(),
    };
    set({ listings: [listing, ...get().listings] });
    return listing;
  },
  addOffer: (input) => {
    const offer: Offer = {
      ...input,
      id: `O-${Date.now()}`,
      status: "PLACED",
      createdAt: new Date().toISOString(),
    };
    set({ offers: [offer, ...get().offers] });
    return offer;
  },
  updateOffer: (id, patch) => {
    const current = get().offers.find((o) => o.id === id);
    set({
      offers: get().offers.map((o) => (o.id === id ? { ...o, ...patch } : o)),
      listings:
        patch.status === "ACCEPTED" && current
          ? get().listings.map((l) => {
              if (l.id !== current.listingId) return l;
              const qty = l.quantity - current.quantity;
              return { ...l, quantity: Math.max(0, qty), active: qty > 0 };
            })
          : get().listings,
    });
  },
}));
