"""
SIH26132 — Pair B: Matching Engine
-----------------------------------
Scores and ranks buyers against a farmer's lot using four factors:
    price_fit, distance, quality_match, buyer_reliability

Designed to be explainable: every score returns *why* it scored that way,
which matters a lot in front of judges (and for debugging your own demo).

Framework-agnostic on purpose — the pure functions below don't touch a DB.
Wire them into your Django/Flask views (example route at the bottom).
"""

import math
from dataclasses import dataclass, field
from typing import Optional


# ---------------------------------------------------------------------------
# 1. Individual scoring components (each returns a value between 0 and 1)
# ---------------------------------------------------------------------------

def price_fit_score(offer_price: float, market_price: float) -> float:
    """
    How well the buyer's offer price matches the current fair market price.
    A buyer offering at or above market price scores highest.
    """
    if not market_price or market_price <= 0:
        return 0.5  # fallback if price data missing
    ratio = offer_price / market_price
    if ratio >= 1:
        return 1.0
    floor = 0.7  # 30% below market = score 0
    return max(0.0, (ratio - floor) / (1 - floor))


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two lat/lng points, in km."""
    R = 6371  # Earth radius in km
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def distance_score(farmer_lat, farmer_lng, buyer_lat, buyer_lng, max_distance_km: float = 150.0):
    """
    Converts distance to a 0-1 score. Closer = higher score.
    Score decays to ~0 by max_distance_km.
    Returns (score, km) so you can display the raw distance too.
    """
    km = haversine_km(farmer_lat, farmer_lng, buyer_lat, buyer_lng)
    score = 1 - km / max_distance_km
    return clamp01(score), round(km)


GRADE_RANK = {"A": 3, "B": 2, "C": 1}


def quality_match_score(lot_grade: str, required_grade: str) -> float:
    """
    Exact grade match = 1.0. One grade off (buyer wants A, lot is B) = 0.5.
    Two grades off = 0.
    """
    lot_rank = GRADE_RANK.get(lot_grade, 2)
    req_rank = GRADE_RANK.get(required_grade, 2)
    diff = abs(lot_rank - req_rank)
    if diff == 0:
        return 1.0
    if diff == 1:
        return 0.5
    return 0.0


def reliability_score(buyer: "Buyer") -> float:
    """
    Buyer reliability, based on past completed transactions.
    For the demo/prototype stage, this can come from seeded data
    rather than a live-computed value — that's a deliberate, reasonable scope cut.
    """
    completed = buyer.completed_transactions
    disputes = buyer.dispute_count
    raw = completed / (completed + disputes * 3 + 1)
    return clamp01(raw)


def clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


# ---------------------------------------------------------------------------
# 2. Data shapes (swap these for your Django models / ORM objects later)
# ---------------------------------------------------------------------------

@dataclass
class Lot:
    id: int
    lat: float
    lng: float
    quality_grade: str


@dataclass
class Offer:
    id: int
    buyer_id: str
    offer_price: float
    required_grade: str


@dataclass
class Buyer:
    id: str
    lat: float
    lng: float
    completed_transactions: int = 0
    dispute_count: int = 0


# Tune these based on your Pair B research — document WHY you chose these
# weights in your PPT/demo notes, judges will ask.
DEFAULT_WEIGHTS = {
    "price": 0.35,
    "distance": 0.25,
    "quality": 0.20,
    "reliability": 0.20,
}


# ---------------------------------------------------------------------------
# 3. Combined match score
# ---------------------------------------------------------------------------

def score_match(lot: Lot, offer: Offer, buyer: Buyer, market_price: float, weights: dict = None) -> dict:
    """
    Computes a full match score + a human-readable breakdown for one buyer
    against one lot. This breakdown is what you show in the UI/demo —
    explainability is the whole point of not using a black-box model here.
    """
    weights = weights or DEFAULT_WEIGHTS

    price = price_fit_score(offer.offer_price, market_price)
    dist_score, dist_km = distance_score(lot.lat, lot.lng, buyer.lat, buyer.lng)
    quality = quality_match_score(lot.quality_grade, offer.required_grade)
    reliability = reliability_score(buyer)

    total = (
        weights["price"] * price
        + weights["distance"] * dist_score
        + weights["quality"] * quality
        + weights["reliability"] * reliability
    )

    return {
        "buyer_id": buyer.id,
        "offer_id": offer.id,
        "total_score": round(total, 3),
        "breakdown": {
            "price_fit": round(price, 2),
            "distance_fit": round(dist_score, 2),
            "distance_km": dist_km,
            "quality_fit": round(quality, 2),
            "reliability": round(reliability, 2),
        },
        "explanation": build_explanation(price, dist_score, dist_km, quality, reliability),
    }


def build_explanation(price, dist_score, dist_km, quality, reliability) -> str:
    """Turns the raw scores into a short human-readable reason string for the UI."""
    parts = []
    if price >= 0.8:
        parts.append("strong price match")
    elif price < 0.4:
        parts.append("price below market")
    if dist_score >= 0.7:
        parts.append(f"nearby ({dist_km} km)")
    elif dist_score < 0.3:
        parts.append(f"far ({dist_km} km)")
    if quality == 1:
        parts.append("exact grade match")
    if reliability >= 0.7:
        parts.append("reliable buyer")
    return ", ".join(parts) if parts else "moderate overall fit"


def rank_offers_for_lot(lot: Lot, offers: list, buyers_by_id: dict, market_price: float, weights: dict = None) -> list:
    """
    Ranks all offers on a given lot, highest score first.
    This is the function your Django/Flask view will actually call.
    """
    results = [
        score_match(lot, offer, buyers_by_id[offer.buyer_id], market_price, weights)
        for offer in offers
    ]
    return sorted(results, key=lambda r: r["total_score"], reverse=True)


# ---------------------------------------------------------------------------
# 4. Example Django REST Framework view (wire this up once Pair A/C's data exists)
# ---------------------------------------------------------------------------
"""
# views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .matching_engine import rank_offers_for_lot, Lot, Offer, Buyer
from .models import LotModel, OfferModel, BuyerModel
from .price_service import get_latest_market_price  # Pair A's module

@api_view(['GET'])
def lot_matches(request, lot_id):
    lot_row = LotModel.objects.get(id=lot_id)
    lot = Lot(id=lot_row.id, lat=lot_row.lat, lng=lot_row.lng, quality_grade=lot_row.quality_grade)

    offer_rows = OfferModel.objects.filter(lot_id=lot_id, status='pending')
    offers = [Offer(id=o.id, buyer_id=o.buyer_id, offer_price=o.offer_price,
                     required_grade=o.required_grade) for o in offer_rows]

    buyer_ids = [o.buyer_id for o in offers]
    buyer_rows = BuyerModel.objects.filter(id__in=buyer_ids)
    buyers_by_id = {
        b.id: Buyer(id=b.id, lat=b.lat, lng=b.lng,
                     completed_transactions=b.completed_transactions,
                     dispute_count=b.dispute_count)
        for b in buyer_rows
    }

    market_price = get_latest_market_price(lot_row.commodity, lot_row.market)
    ranked = rank_offers_for_lot(lot, offers, buyers_by_id, market_price)
    return Response({"lot_id": lot_id, "matches": ranked})
"""


# ---------------------------------------------------------------------------
# 5. Quick manual test — run with: python matching_engine.py
#    (Lets Pair B sanity-check the scoring before any DB/route exists)
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import json

    lot = Lot(id=1, lat=20.0, lng=74.5, quality_grade="A")  # Lasalgaon-ish
    market_price = 1800  # ₹ per quintal, example

    offers = [
        Offer(id=101, buyer_id="B1", offer_price=1850, required_grade="A"),
        Offer(id=102, buyer_id="B2", offer_price=1600, required_grade="B"),
        Offer(id=103, buyer_id="B3", offer_price=1900, required_grade="A"),
    ]

    buyers_by_id = {
        "B1": Buyer(id="B1", lat=20.1, lng=74.6, completed_transactions=12, dispute_count=0),
        "B2": Buyer(id="B2", lat=21.5, lng=76.0, completed_transactions=3, dispute_count=1),
        "B3": Buyer(id="B3", lat=19.9, lng=74.4, completed_transactions=30, dispute_count=2),
    }

    ranked = rank_offers_for_lot(lot, offers, buyers_by_id, market_price)
    print(json.dumps(ranked, indent=2))
