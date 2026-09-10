import { createFileRoute } from "@tanstack/react-router";
import { LEARNED_WEIGHTS } from "@/lib/ml/matching";
import { runPriceModel } from "@/lib/ml/price-model";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DATA_SOURCE } from "@/lib/data/catalog";

export const Route = createFileRoute("/how")({ component: HowPage });

function HowPage() {
  const onion = runPriceModel("onion");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">What is actually running</h1>
        <p className="mt-2 max-w-2xl text-base font-medium text-ink">
          Proof of concept for SIH26132 — price discovery plus buyer matching. Models stay
          inspectable: no black box on the score a farmer is asked to trust.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Price model</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3 text-base font-medium text-ink">
          <p>
            Ordinary least squares on seasonal Fourier terms, 1/7/14-day lags and log arrivals.
            The last observation of each crop is pinned to the official 8 September 2026 Maharashtra
            modal from {DATA_SOURCE}.
          </p>
          <p>
            Onion hold-out MAPE {onion.mape}% · RMSE ₹{onion.rmse} · n={onion.nSamples}. Forecasts
            carry an 80% band that widens with horizon. Sale-window subtracts crop-specific storage
            cost before telling a farmer to wait.
          </p>
          <ul className="grid gap-1 font-mono text-sm font-bold">
            {onion.featureWeights.map((f) => (
              <li key={f.name} className="flex justify-between border-b border-line py-1">
                <span>{f.name}</span>
                <span>{f.weight}</span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Matching model</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3 text-base font-medium text-ink">
          <p>
            Four 0–1 features (price fit, distance, grade, reliability) feed a logistic regression.
            Coefficients were learned with the attached training script. Phase 1 uses documented
            synthetic outcomes; the same export format swaps to live accept/reject rows later.
          </p>
          <Badge tone="warn">trained_on: {LEARNED_WEIGHTS.trainedOn}</Badge>
          <ul className="grid gap-1 font-mono text-sm font-bold">
            <li className="flex justify-between border-b border-line py-1">
              <span>intercept</span>
              <span>{LEARNED_WEIGHTS.intercept.toFixed(3)}</span>
            </li>
            {Object.entries(LEARNED_WEIGHTS.weights).map(([k, v]) => (
              <li key={k} className="flex justify-between border-b border-line py-1">
                <span>{k}</span>
                <span>{v.toFixed(3)}</span>
              </li>
            ))}
          </ul>
          <p>
            Accuracy {LEARNED_WEIGHTS.metrics.accuracy} · log loss {LEARNED_WEIGHTS.metrics.logLoss}{" "}
            · ROC AUC {LEARNED_WEIGHTS.metrics.rocAuc} on a held-out synthetic set. Distance uses
            haversine between the lot mandi and the buyer HQ.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. What this prototype proves</CardTitle>
        </CardHeader>
        <CardBody className="space-y-2 text-base font-medium text-ink">
          <p>Farmers see a local forecast and a sale window before they post a lot.</p>
          <p>Buyers can browse without KYC; placing an offer requires a verified profile.</p>
          <p>Offers on a lot are ranked with a readable breakdown, not a single opaque number.</p>
          <p>Accept writes a digital price-lock — the kachi parchi replacement.</p>
        </CardBody>
      </Card>
    </div>
  );
}
