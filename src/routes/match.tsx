import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CROPS } from "@/lib/data/catalog";
import { BUYERS, useApp } from "@/lib/store";
import { rankOffers, LEARNED_WEIGHTS, type MatchInput } from "@/lib/ml/matching";
import { runPriceModel } from "@/lib/ml/price-model";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { formatInr } from "@/lib/utils";

export const Route = createFileRoute("/match")({ component: MatchPage });

function MatchPage() {
  const listings = useApp((s) => s.listings);
  const offers = useApp((s) => s.offers);
  const role = useApp((s) => s.role);
  const updateOffer = useApp((s) => s.updateOffer);
  const [listingId, setListingId] = useState(listings[0]?.id ?? "");
  const listing = listings.find((l) => l.id === listingId) ?? listings[0];

  const market = listing ? runPriceModel(listing.crop).current : 0;

  const ranked = useMemo(() => {
    if (!listing) return [];
    const related = offers.filter((o) => o.listingId === listing.id && o.status !== "REJECTED");
    const inputs: MatchInput[] = related
      .map((o) => {
        const buyer = BUYERS.find((b) => b.id === o.buyerId);
        if (!buyer) return null;
        return {
          lot: {
            id: listing.id,
            lat: listing.lat,
            lng: listing.lng,
            grade: listing.grade,
            listingPrice: listing.price,
          },
          offer: {
            id: o.id,
            buyerId: o.buyerId,
            offerPrice: o.offeredPrice,
            requiredGrade: o.requiredGrade,
          },
          buyer,
          marketPrice: market,
        };
      })
      .filter((x): x is MatchInput => x !== null);
    return rankOffers(inputs);
  }, [listing, offers, market]);

  if (!listing) return <p>No lots yet.</p>;

  function accept(offerId: string) {
    const offer = offers.find((o) => o.id === offerId);
    if (!offer || !listing) return;
    updateOffer(offerId, {
      status: "ACCEPTED",
      priceLock: {
        listing_id: listing.id,
        crop: listing.crop,
        grade: listing.grade,
        quantity_quintal: String(offer.quantity),
        locked_price_per_quintal: String(offer.offeredPrice),
        buyer_id: offer.buyerId,
        farmer: listing.farmerName,
        locked_at: new Date().toISOString(),
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Match desk</h1>
          <p className="text-base font-medium text-ink">
            Logistic ranker · trained accuracy {LEARNED_WEIGHTS.metrics.accuracy * 100}% · ROC AUC{" "}
            {LEARNED_WEIGHTS.metrics.rocAuc}
          </p>
        </div>
        <Select value={listing.id} onChange={(e) => setListingId(e.target.value)} className="w-72">
          {listings.map((l) => (
            <option key={l.id} value={l.id}>
              {l.id} {CROPS[l.crop].name} · {l.farmerName}
            </option>
          ))}
        </Select>
      </div>

      <Card>
        <CardBody className="flex flex-wrap gap-6 pt-5 text-base font-medium">
          <Stat label="Lot" value={`${CROPS[listing.crop].name} ${listing.variety}`} />
          <Stat label="Ask" value={formatInr(listing.price)} />
          <Stat label="Model modal" value={formatInr(market)} />
          <Stat label="Grade" value={listing.grade} />
          <Stat label="Qty" value={`${listing.quantity} qtl`} />
        </CardBody>
      </Card>

      <div className="grid gap-3">
        {ranked.map((r, i) => {
          const offer = offers.find((o) => o.id === r.offerId)!;
          const buyer = BUYERS.find((b) => b.id === r.buyerId)!;
          const lock = offer.status === "ACCEPTED" ? offer.priceLock : undefined;
          return (
            <Card key={r.offerId}>
              <CardBody className="space-y-3 pt-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-subtle">#{i + 1}</span>
                      <h3 className="text-lg font-medium">{buyer.name}</h3>
                      <Badge tone={buyer.kyc === "VERIFIED" ? "ok" : "warn"}>{buyer.kyc}</Badge>
                    </div>
                    <p className="text-base font-medium text-ink">
                      {buyer.type} · offer {formatInr(offer.offeredPrice)} · {r.explanation}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold tabular-nums">{r.totalScore}</div>
                    <div className="text-sm font-medium text-muted">P(accept) %</div>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-4">
                  <Bar label="Price" value={r.breakdown.priceFit} />
                  <Bar label={`Distance ${r.breakdown.distanceKm} km`} value={r.breakdown.distanceFit} />
                  <Bar label="Grade" value={r.breakdown.qualityFit} />
                  <Bar label="Reliability" value={r.breakdown.reliability} />
                </div>
                {role === "farmer" && offer.status === "PLACED" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => accept(offer.id)}>
                      Accept & lock price
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => updateOffer(offer.id, { status: "REJECTED" })}>
                      Reject
                    </Button>
                  </div>
                )}
                {lock && (
                  <div className="rounded-[var(--radius-md)] border-2 border-line bg-surface-2 p-3 font-mono text-sm font-bold">
                    PRICE-LOCK · {lock.crop} grade {lock.grade} · {lock.quantity_quintal} qtl @ ₹
                    {lock.locked_price_per_quintal} · {lock.locked_at}
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })}
        {ranked.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>No live offers</CardTitle>
            </CardHeader>
            <CardBody className="text-base font-medium text-ink">
              Switch to Buyer on Lots and place an offer, then return here.
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm font-bold uppercase tracking-wide text-ink">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm font-bold text-ink">
        <span>{label}</span>
        <span className="tabular-nums">{Math.round(value * 100)}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full border-2 border-line bg-surface-2">
        <div className="h-full bg-accent" style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
    </div>
  );
}
