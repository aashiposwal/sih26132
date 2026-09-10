# Matching engine (original)

Python source that produced the logistic weights used in `src/lib/ml/matching.ts`.

- `sample_engine.py` — feature builder, logistic score, explainable breakdown, price-lock JSON
- `train_matching_model.py` — trains on labelled pairs, writes `learned_weights.json`
- `learned_weights.json` — intercept + weights (price, distance, quality, reliability)

```bash
python engine/train_matching_model.py
```
