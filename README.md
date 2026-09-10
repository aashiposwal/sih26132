# Kshetra

**Smart India Hackathon 2026 · PS26132**  
Farm-gate price discovery and explainable buyer matching for Maharashtra crops.

<<<<<<< HEAD
=======
**Repo:** https://github.com/aashiposwal/sih26132

>>>>>>> fee23e5151d6cf656fa29447de8766cb5437dd10
Kshetra is a working proof-of-concept. A farmer sees a **local mandi forecast** and a **sale window**, lists a lot at a price they choose, and ranked buyers come back with an **explainable match score** plus a **digital price-lock** (kachi parchi replacement).

## Problem

Maharashtra farmers still sell with weak price discovery: mandi rates are delayed or distant, buyers are opaque, and the first offer is often accepted because there is no comparable counter. Post-harvest loss and middlemen fill that gap.

PS26132 asks for market linkages and price discovery that a farmer can actually use — not a national average dashboard.

## What this prototype does

| Screen | What you see |
|---|---|
| **Command** | 21-day mandi forecast (seasonal lag OLS), MAPE/RMSE, sell-now vs hold window after storage cost |
| **Mandis** | Official-style Maharashtra snapshot (onion, tomato, soybean, tur, grapes, …) |
| **Lots** | Farmer listing with model-suggested price (never overwritten) + heuristic quality grade |
| **Matching** | Logistic ranker on price fit, distance, grade, reliability → breakdown + price-lock JSON |
| **The model** | Coefficients, data source, and what is synthetic vs Agmarknet-calibrated |

Role switcher: Farmer / Buyer / Official.

## Tech stack

- **App:** React + TanStack Start, Zustand, Recharts  
- **Price model:** ordinary least squares with Fourier seasonality, 1/7/14-day lags, log arrivals (`src/lib/ml/price-model.ts`)  
- **Matching:** logistic regression with learned weights from `engine/train_matching_model.py` (`src/lib/ml/matching.ts`)  
- **Training data:** Maharashtra mandi series calibrated to Agmarknet / data.gov.in style snapshots (Lasalgaon onion, Latur soybean, etc.)  
- **Original engine:** `engine/` (Python sample engine + weights JSON)

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:8080](http://localhost:8080).

```bash
npm run typecheck
npm run build
```

## Repository layout

```
src/lib/ml/          price model, matching, quality grader
src/lib/data/        Maharashtra crop/mandi catalog + historical series
src/routes/          Command, Mandis, Lots, Matching, The model
engine/              original Python matching engine + learned weights
submission/          SIH 6-slide outline + screenshots
```

## Data note

Today's modal prices are pinned to an official-style Maharashtra mandi snapshot (8 September 2026). Historical paths are reconstructed so the last observation matches that snapshot. Matching weights were learned on documented synthetic accept/reject labels (`synthetic_v1`) with the same four features the live ranker uses. Swap the export JSON when live outcomes exist.

## Demo path (2 minutes)

1. Command — pick onion, read forecast + sale window.  
2. Lots — switch to Farmer, publish a lot (suggested price is optional).  
3. Matching — ranked offers, component bars, Accept → price-lock slip.  
4. The model — show judges the coefficients.

## Team / submission

- **PS ID:** SIH26132  
- **Category:** Software  
- **Theme:** Agriculture / market linkages  

See [submission/PPT_OUTLINE.md](submission/PPT_OUTLINE.md) for the official 6-slide structure.

## License

MIT — see [LICENSE](LICENSE).
