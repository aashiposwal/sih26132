# SIH 2026 — 6-slide outline (PS26132)

Use the official SIH template. Do not add extra slides. Paste and shorten.

## Slide 1 — Title
- **PS ID:** SIH26132
- **Title:** Kshetra — farm-gate price discovery and explainable buyer matching
- **Theme:** Agriculture / market linkages
- **Category:** Software
- Team ID + registered team name (from SIH portal)
- One line: *Sell into a known Maharashtra mandi price, not a guess.*

## Slide 2 — Proposed solution
- Information asymmetry at the farm gate (delayed mandi, opaque buyers).
- Kshetra: local 21-day forecast + sale window (storage-cost net) + ranked verified buyers.
- Farmer keeps the ask; the model never overwrites price.
- Innovation: explainable logistic match (price, distance, grade, reliability) + digital price-lock (kachi parchi).
- Uniqueness: Maharashtra Agmarknet-calibrated series, not a national average; every rank has a reason string.

## Slide 3 — Technical approach
- Price: OLS with seasonal Fourier terms, lags 1/7/14, log arrivals. Last point pinned to official MH mandi snapshot.
- Match: 4 features → logistic regression (`engine/train_matching_model.py` weights).
- Quality: heuristic grader (CV stub).
- Stack: React / TanStack Start, on-device models for the PoC.
- Flowchart: Lot → forecast/suggest → offers → rank + breakdown → Accept → price-lock JSON.
- Screenshot: Command chart + Matching desk.

## Slide 4 — Feasibility
- PoC runs today: Command / Mandis / Lots / Matching.
- Data: public Agmarknet / data.gov.in style mandi series (Maharashtra).
- Risk: live APIs rate-limit → cache daily snapshot (already designed).
- Risk: quality CV not production → heuristic with confidence, swap-in later.
- Risk: matching trained on synthetic_v1 labels → same JSON export for live accept/reject.
- Mitigation: works fully offline in the browser for demo; recorded backup video.

## Slide 5 — Impact
- Farmer: know local modal + whether to hold, before listing.
- Buyer/FPO: ranked lots with grade and distance, KYC-gated offers.
- Economic: fewer distress sales, shorter search, less post-harvest wait.
- Social: readable UI (high contrast, large type) for outdoor / low-vision use.
- Gov: audit trail of price-lock vs informal kachi parchi.

## Slide 6 — References / next
- Agmarknet / data.gov.in mandi prices
- Maharashtra district mandis (Lasalgaon onion, Latur soybean, …)
- Repo: https://github.com/aashiposwal/sih26132
- Next: live Agmarknet ingest, CV grade from lot photo, FPO bulk lots, Marathi UI
