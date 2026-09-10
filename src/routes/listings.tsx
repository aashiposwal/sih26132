import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { CROPS, MANDIS, type CropId } from "@/lib/data/catalog";
import { runPriceModel } from "@/lib/ml/price-model";
import { gradeQuality } from "@/lib/ml/quality";
import { BUYERS, useApp } from "@/lib/store";
import { rankOffers, type MatchInput } from "@/lib/ml/matching";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldLabel, Input, Select } from "@/components/ui/input";
import { formatInr, formatQty } from "@/lib/utils";

export const Route = createFileRoute("/listings")({ component: ListingsPage });

function ListingsPage() {
  const role = useApp((s) => s.role);
  const listings = useApp((s) => s.listings);
  const addListing = useApp((s) => s.addListing);
  const addOffer = useApp((s) => s.addOffer);
  const activeBuyerId = useApp((s) => s.activeBuyerId);
  const setBuyer = useApp((s) => s.setBuyer);

  const [crop, setCrop] = useState<CropId>("onion");
  const [mandiId, setMandiId] = useState("lasalgaon");
  const [variety, setVariety] = useState("Unhali");
  const [qty, setQty] = useState("40");
  const [price, setPrice] = useState("");
  const [name, setName] = useState("Savita Patil");
  const [moisture, setMoisture] = useState(0.25);
  const [uniform, setUniform] = useState(0.8);
  const [sprout, setSprout] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const suggestion = useMemo(() => runPriceModel(crop), [crop]);
  const quality = useMemo(
    () => gradeQuality({ sizeUniformity: uniform, moisture, sprouting: sprout, discoloration: 0.1 }),
    [uniform, moisture, sprout],
  );

  function onCreate(e: FormEvent) {
    e.preventDefault();
    const p = Number(price) || suggestion.current;
    const listing = addListing({
      farmerName: name,
      crop,
      variety,
      grade: quality.grade,
      quantity: Number(qty),
      price: p,
      mandiId,
    });
    setMsg(
      `Lot ${listing.id} posted at ${formatInr(p)}. Model suggested ${formatInr(suggestion.current)} — your number was kept.`,
    );
  }

  function bid(listingId: string, listingPrice: number) {
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) return;
    const buyer = BUYERS.find((b) => b.id === activeBuyerId)!;
    if (buyer.kyc !== "VERIFIED") {
      setMsg("Complete KYC before placing an offer. Browsing stays open.");
      return;
    }
    const offered = Math.round(listingPrice * 0.99);
    const dummy: MatchInput = {
      lot: {
        id: listing.id,
        lat: listing.lat,
        lng: listing.lng,
        grade: listing.grade,
        listingPrice: listing.price,
      },
      offer: { id: "tmp", buyerId: buyer.id, offerPrice: offered, requiredGrade: listing.grade },
      buyer,
      marketPrice: listing.price,
    };
    const scored = rankOffers([dummy])[0]!;
    addOffer({
      listingId,
      buyerId: buyer.id,
      quantity: listing.quantity,
      offeredPrice: offered,
      requiredGrade: listing.grade,
      matchScore: scored.totalScore,
      explanation: scored.explanation,
    });
    setMsg(`Offer placed at ${formatInr(offered)} · match ${scored.totalScore}`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>Post a lot</CardTitle>
          <p className="text-base font-medium text-ink">Farmer flow. The model suggests a price; it never overwrites yours.</p>
        </CardHeader>
        <CardBody>
          <form className="space-y-3" onSubmit={onCreate}>
            <div>
              <FieldLabel>Farmer</FieldLabel>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Crop</FieldLabel>
                <Select value={crop} onChange={(e) => setCrop(e.target.value as CropId)}>
                  {Object.values(CROPS).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <FieldLabel>Mandi</FieldLabel>
                <Select value={mandiId} onChange={(e) => setMandiId(e.target.value)}>
                  {MANDIS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Variety</FieldLabel>
                <Input value={variety} onChange={(e) => setVariety(e.target.value)} />
              </div>
              <div>
                <FieldLabel>Quantity (qtl)</FieldLabel>
                <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
              </div>
            </div>
            <div>
              <FieldLabel>Your price (₹/qtl) — blank uses suggestion</FieldLabel>
              <Input
                type="number"
                placeholder={String(suggestion.current)}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <p className="mt-1 text-sm font-medium text-ink">
                Suggestion {formatInr(suggestion.current)} · window:{" "}
                {suggestion.saleWindow.action === "hold"
                  ? `hold ${suggestion.saleWindow.holdDays}d`
                  : "sell now"}
              </p>
            </div>
            <div className="rounded-[var(--radius-md)] border-2 border-line bg-bg p-3">
              <div className="mb-2 text-sm font-bold text-ink">Quality grader (heuristic stand-in for CV)</div>
              <label className="flex items-center justify-between text-sm">
                Size uniformity
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={uniform}
                  onChange={(e) => setUniform(Number(e.target.value))}
                />
              </label>
              <label className="flex items-center justify-between text-sm">
                Moisture
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={moisture}
                  onChange={(e) => setMoisture(Number(e.target.value))}
                />
              </label>
              <label className="mt-2 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={sprout} onChange={(e) => setSprout(e.target.checked)} />
                Sprouting visible
              </label>
              <div className="mt-2 flex items-center gap-2">
                <Badge tone={quality.grade === "A" ? "ok" : quality.grade === "B" ? "warn" : "danger"}>
                  Grade {quality.grade}
                </Badge>
                <span className="text-sm font-medium text-ink">confidence {quality.confidence}</span>
              </div>
            </div>
            <Button type="submit" disabled={role === "buyer"}>
              Publish lot
            </Button>
            {role === "buyer" && (
              <p className="text-sm font-bold text-warn">Switch to Farmer to publish. Buyers place offers from the list.</p>
            )}
          </form>
        </CardBody>
      </Card>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-3xl">Open lots</h1>
          {role === "buyer" && (
            <Select value={activeBuyerId} onChange={(e) => setBuyer(e.target.value)} className="w-56">
              {BUYERS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.kyc})
                </option>
              ))}
            </Select>
          )}
        </div>
        {msg && <p className="rounded-[var(--radius-md)] border-2 border-line bg-surface-2 px-3 py-2 text-base font-medium">{msg}</p>}
        {listings
          .filter((l) => l.active)
          .map((l) => (
            <Card key={l.id}>
              <CardBody className="flex flex-wrap items-center justify-between gap-3 pt-5">
                <div>
                  <div className="text-base font-medium text-ink">
                    {l.id} · {l.farmerName} · {l.district}
                  </div>
                  <div className="text-xl font-bold">
                    {CROPS[l.crop].name} {l.variety}{" "}
                    <Badge tone={l.grade === "A" ? "ok" : "warn"}>Grade {l.grade}</Badge>
                  </div>
                  <div className="font-mono text-base font-bold tabular-nums text-ink">
                    {formatQty(l.quantity)} @ {formatInr(l.price)}
                  </div>
                </div>
                {role === "buyer" && (
                  <Button size="sm" onClick={() => bid(l.id, l.price)}>
                    Place offer
                  </Button>
                )}
              </CardBody>
            </Card>
          ))}
      </div>
    </div>
  );
}
