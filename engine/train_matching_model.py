"""
SIH26132 — Pair B: ML Match-Scoring Model (training script)
-------------------------------------------------------------
Learns weights for the matching engine instead of hand-picking them.

Why logistic regression, not a fancier model:
  - The four input features (price_fit, distance_fit, quality_fit, reliability)
    are already the same explainable 0-1 scores from matching_engine.py.
  - Logistic regression's learned coefficients ARE the weights — fully
    interpretable, no black box. This matters for the "explainable AI"
    framing judges respond well to.
  - With only 4 features and (initially) synthetic data, a more complex
    model (random forest / gradient boosting) would just overfit noise —
    not worth the added opacity for zero real gain in accuracy.

Cold-start strategy:
  - PHASE 1 (now): train on synthetic data, generated using the research
    findings as ground truth (price + distance matter most; quality and
    reliability matter, but less). This is clearly documented as synthetic
    in the demo — don't claim it's real transaction data.
  - PHASE 2 (once the platform has real usage): replace `generate_synthetic_data()`
    with a query that pulls real (features -> accepted/rejected) rows from
    your Offer/Transaction tables, and retrain periodically. Same script,
    same output format — just swap the data source.

Output: learned_weights.json — consumed by matching-engine.js / matching_engine.py
so the actual scoring code doesn't need scikit-learn at request time.
"""

import json
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, log_loss, roc_auc_score


# ---------------------------------------------------------------------------
# PHASE 1: Synthetic data generation (swap this out for real data later)
# ---------------------------------------------------------------------------

def generate_synthetic_data(n_samples: int = 2000, seed: int = 42):
    """
    Generates synthetic (features -> accepted/rejected) examples.

    Ground-truth weights below reflect the research we gathered:
      - price_fit and distance_fit are the strongest determinants of
        marketing channel / buyer choice in the agricultural marketing
        literature (Frontiers 2023 garden pea study; Virginia Tech
        smallholder distance study)
      - quality_fit matters (AGMARK grading exists precisely because
        quality-price alignment affects transaction success)
      - reliability matters less at the offer-acceptance stage for a
        first-time marketplace (it matters more for repeat engagement,
        which isn't what we're predicting here)

    This is what a real logistic regression would ideally recover once
    trained on actual platform data — for now we bake in reasonable
    ground truth so the trained model's coefficients land somewhere sensible.
    """
    rng = np.random.default_rng(seed)

    price_fit = rng.uniform(0, 1, n_samples)
    distance_fit = rng.uniform(0, 1, n_samples)
    quality_fit = rng.choice([0, 0.5, 1], n_samples, p=[0.15, 0.25, 0.6])
    reliability = rng.uniform(0, 1, n_samples)

    # Ground-truth linear combination (log-odds), plus noise
    true_weights = {"price": 3.2, "distance": 2.4, "quality": 1.6, "reliability": 1.0}
    intercept = -2.8  # calibrates baseline acceptance rate to a realistic level

    logit = (
        intercept
        + true_weights["price"] * price_fit
        + true_weights["distance"] * distance_fit
        + true_weights["quality"] * quality_fit
        + true_weights["reliability"] * reliability
        + rng.normal(0, 0.4, n_samples)  # noise: real-world unpredictability
    )
    prob_accept = 1 / (1 + np.exp(-logit))
    accepted = rng.binomial(1, prob_accept)

    X = np.column_stack([price_fit, distance_fit, quality_fit, reliability])
    y = accepted
    return X, y


# ---------------------------------------------------------------------------
# PHASE 2 (future): pull real data instead — same X, y shape
# ---------------------------------------------------------------------------
"""
def load_real_data():
    # Example once you have real logged offers:
    rows = db.execute('''
        SELECT price_fit, distance_fit, quality_fit, reliability, accepted
        FROM offer_outcomes
    ''').fetchall()
    X = np.array([[r.price_fit, r.distance_fit, r.quality_fit, r.reliability] for r in rows])
    y = np.array([r.accepted for r in rows])
    return X, y
"""


# ---------------------------------------------------------------------------
# Train + evaluate
# ---------------------------------------------------------------------------

def train_and_export(output_path: str = "learned_weights.json"):
    X, y = generate_synthetic_data()
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = LogisticRegression()
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    probs = model.predict_proba(X_test)[:, 1]

    print("=== Model evaluation (on held-out test set) ===")
    print(f"Accuracy: {accuracy_score(y_test, preds):.3f}")
    print(f"Log loss: {log_loss(y_test, probs):.3f}")
    print(f"ROC AUC:  {roc_auc_score(y_test, probs):.3f}")

    feature_names = ["price", "distance", "quality", "reliability"]
    coefs = model.coef_[0]

    print("\n=== Learned weights (feature importance) ===")
    for name, coef in zip(feature_names, coefs):
        print(f"  {name:12s}: {coef:+.3f}")
    print(f"  {'intercept':12s}: {model.intercept_[0]:+.3f}")

    weights_export = {
        "intercept": float(model.intercept_[0]),
        "weights": {name: float(coef) for name, coef in zip(feature_names, coefs)},
        "trained_on": "synthetic_v1",  # change to "real_v1", "real_v2", etc. once retrained on real data
        "n_samples": len(X),
        "metrics": {
            "accuracy": float(accuracy_score(y_test, preds)),
            "log_loss": float(log_loss(y_test, probs)),
            "roc_auc": float(roc_auc_score(y_test, probs)),
        },
    }

    with open(output_path, "w") as f:
        json.dump(weights_export, f, indent=2)
    print(f"\nWeights exported to {output_path}")
    return weights_export


if __name__ == "__main__":
    train_and_export()
