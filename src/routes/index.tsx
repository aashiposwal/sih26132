import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, TrendingUp, Users, Warehouse } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CROPS, DATA_SOURCE, REPORT_DATE, type CropId } from "@/lib/data/catalog";
import { historyFor } from "@/lib/data/series";
import { runPriceModel } from "@/lib/ml/price-model";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { formatInr } from "@/lib/utils";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/")({ component: Home });

const FEATURED: CropId[] = ["onion", "tomato", "soybean", "tur"];

function Home() {
  const [crop, setCrop] = useState<CropId>("onion");
  const model = useMemo(() => runPriceModel(crop), [crop]);
  const hist = useMemo(() => historyFor(crop).slice(-90), [crop]);
  const spec = CROPS[crop];
  const chart = [
    ...hist.map((h) => ({ date: h.date.slice(5), actual: h.modal, predicted: undefined as number | undefined })),
    ...model.forecast.map((f) => ({ date: f.date.slice(5), actual: undefined, predicted: f.predicted })),
  ];

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.12em] text-ink">
            SIH26132 · Maharashtra
          </p>
          <h1 className="max-w-xl text-4xl font-bold text-ink md:text-5xl">
            Sell into a known price, not a guess.
          </h1>
          <p className="mt-4 max-w-lg text-base font-medium text-ink">
            Kshetra is a farm-gate market intelligence desk. It forecasts local mandi prices from
            Agmarknet-style Maharashtra series, then ranks verified buyers with an explainable match
            score.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/listings">
              <Button>
                List a lot <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/match">
              <Button variant="secondary">Rank offers</Button>
            </Link>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Today in Maharashtra</CardTitle>
            <p className="text-sm font-medium text-ink">{REPORT_DATE} · official mandi snapshot</p>
          </CardHeader>
          <CardBody className="grid grid-cols-2 gap-3">
            {FEATURED.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setCrop(id)}
                className={`rounded-[var(--radius-md)] border-2 px-3 py-3 text-left ${
                  crop === id ? "border-accent bg-surface-2" : "border-line bg-bg"
                }`}
              >
                <div className="text-sm font-bold text-ink">{CROPS[id].name}</div>
                <div className="font-mono text-xl font-bold tabular-nums">{formatInr(CROPS[id].todayStateAvg)}</div>
                <div className="text-sm font-medium text-muted">{CROPS[id].reportingMandis} mandis</div>
              </button>
            ))}
          </CardBody>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>
              {spec.name} · 21-day forecast
            </CardTitle>
            <p className="text-base font-medium text-ink">
              Seasonal lag OLS trained on {model.nSamples} days · MAPE {model.mape}% · RMSE{" "}
              {formatInr(model.rmse)}
            </p>
          </div>
          <Badge tone={model.saleWindow.action === "hold" ? "warn" : "ok"}>
            {model.saleWindow.action === "hold"
              ? `Hold ${model.saleWindow.holdDays} days · +${model.saleWindow.expectedUpliftPct}% net`
              : "Sell now"}
          </Badge>
        </CardHeader>
        <CardBody>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <CartesianGrid stroke="#1e293b" strokeOpacity={0.25} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 13, fill: "#1e293b", fontWeight: 700 }} />
                <YAxis
                  tick={{ fontSize: 13, fill: "#1e293b", fontWeight: 700 }}
                  tickFormatter={(v) => `${Math.round(Number(v) / 100) / 10}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#fdfbf7",
                    border: "2px solid #1e293b",
                    borderRadius: 8,
                    color: "#1e293b",
                    fontWeight: 700,
                  }}
                />
                <Area type="monotone" dataKey="actual" stroke="#1e4620" strokeWidth={3} fill="#1e4620" fillOpacity={0.22} />
                <Area
                  type="monotone"
                  dataKey="predicted"
                  stroke="#d97706"
                  strokeWidth={3}
                  fill="#d97706"
                  fillOpacity={0.16}
                  strokeDasharray="5 4"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-base font-medium text-ink">{model.saleWindow.reason}</p>
          <p className="mt-2 text-sm font-medium text-muted">{DATA_SOURCE}</p>
        </CardBody>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <TrendingUp className="size-4 text-accent" />
            <CardTitle className="mt-2">Price discovery</CardTitle>
          </CardHeader>
          <CardBody className="text-base font-medium text-ink">
            Local modal, min/max and a sale window that already nets storage cost — not a national
            average.
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <Users className="size-4 text-accent" />
            <CardTitle className="mt-2">Explainable matching</CardTitle>
          </CardHeader>
          <CardBody className="text-base font-medium text-ink">
            Logistic weights on price, distance, grade and reliability. Every rank comes with a
            reason string.
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <Warehouse className="size-4 text-accent" />
            <CardTitle className="mt-2">Price-lock slip</CardTitle>
          </CardHeader>
          <CardBody className="text-base font-medium text-ink">
            Accepting an offer writes a digital kachi parchi — crop, grade, qty, locked rupees,
            both parties, timestamp.
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
