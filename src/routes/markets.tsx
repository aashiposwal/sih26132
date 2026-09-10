import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CROPS, MANDIS, TODAY_QUOTES, REPORT_DATE, DATA_SOURCE, type CropId } from "@/lib/data/catalog";
import { formatInr } from "@/lib/utils";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/input";

export const Route = createFileRoute("/markets")({ component: Markets });

function Markets() {
  const [crop, setCrop] = useState<CropId | "all">("onion");
  const rows = useMemo(
    () => TODAY_QUOTES.filter((q) => crop === "all" || q.crop === crop),
    [crop],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Mandi board</h1>
          <p className="mt-1 text-base font-medium text-ink">
            {REPORT_DATE} snapshot · {DATA_SOURCE}
          </p>
        </div>
        <div className="w-56">
          <Select value={crop} onChange={(e) => setCrop(e.target.value as CropId | "all")}>
            <option value="all">All crops</option>
            {Object.values(CROPS).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-xl)] border-2 border-line bg-surface">
        <table className="w-full min-w-[640px] text-left text-base">
          <thead className="border-b-2 border-line text-sm font-bold uppercase tracking-wide text-ink">
            <tr>
              <th className="px-4 py-3 font-medium">Mandi</th>
              <th className="px-4 py-3 font-medium">Crop</th>
              <th className="px-4 py-3 font-medium">Variety</th>
              <th className="px-4 py-3 font-medium text-right">Min</th>
              <th className="px-4 py-3 font-medium text-right">Modal</th>
              <th className="px-4 py-3 font-medium text-right">Max</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((q, i) => {
              const m = MANDIS.find((x) => x.id === q.mandiId);
              return (
                <tr key={i} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{m?.name}</div>
                    <div className="text-sm font-medium text-muted">{m?.district}</div>
                  </td>
                  <td className="px-4 py-3">{CROPS[q.crop].name}</td>
                  <td className="px-4 py-3">{q.variety}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{formatInr(q.min)}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums font-medium">
                    {formatInr(q.modal)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{formatInr(q.max)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How this data is used</CardTitle>
        </CardHeader>
        <CardBody className="space-y-2 text-base font-medium text-ink">
          <p>
            Today's official modal prices pin the last observation of each crop series. The
            forecast model then walks 21 days ahead using seasonality and lagged prices.
          </p>
          <Badge>Source of truth: Agmarknet / data.gov.in daily commodity prices</Badge>
        </CardBody>
      </Card>
    </div>
  );
}
