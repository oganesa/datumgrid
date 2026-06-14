"use client";

import React, { useEffect, useState } from "react";
import {
  computeMarginPercent,
  computeMarkupPercent,
} from "@/lib/catalog-shared";
import { reconcilePricing } from "@/lib/catalog-pricing-reconcile";

type Props = {
  initialCost: number;
  initialPrice: number;
  onValuesChange?: (v: { cost: number; price: number }) => void;
};

function parseMoneyInput(raw: string): number {
  const v = parseFloat(raw);
  return Number.isFinite(v) ? Math.max(0, v) : 0;
}

function parsePercentInput(raw: string): number | null {
  if (raw.trim() === "" || raw === "-") return null;
  const v = parseFloat(raw);
  return Number.isFinite(v) ? v : null;
}

export default function CatalogPricingFields({
  initialCost,
  initialPrice,
  onValuesChange,
}: Props) {
  const [cost, setCost] = useState(initialCost);
  const [price, setPrice] = useState(initialPrice);
  const [marginPct, setMarginPct] = useState<number | null>(() =>
    computeMarginPercent(initialCost, initialPrice)
  );
  const [markupPct, setMarkupPct] = useState<number | null>(() =>
    computeMarkupPercent(initialCost, initialPrice)
  );

  useEffect(() => {
    setCost(initialCost);
    setPrice(initialPrice);
    setMarginPct(computeMarginPercent(initialCost, initialPrice));
    setMarkupPct(computeMarkupPercent(initialCost, initialPrice));
    onValuesChange?.({ cost: initialCost, price: initialPrice });
  }, [initialCost, initialPrice]);

  function pushSnapshot(next: {
    cost: number;
    price: number;
    marginPercent: number | null;
    markupPercent: number | null;
  }) {
    setCost(next.cost);
    setPrice(next.price);
    setMarginPct(next.marginPercent);
    setMarkupPct(next.markupPercent);
    onValuesChange?.({ cost: next.cost, price: next.price });
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col">
          <label className="mb-1 text-xs text-[#6B7280]">Unit cost (USD)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={cost}
            onChange={(e) => {
              const next = reconcilePricing("cost", {
                cost: parseMoneyInput(e.target.value),
                price,
                marginPercent: marginPct,
                markupPercent: markupPct,
              });
              pushSnapshot(next);
            }}
            className="rounded border border-[#E5EAF2] p-2 outline-none focus:border-[#4A90E2]"
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-1 text-xs text-[#6B7280]">Unit price (USD)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => {
              const next = reconcilePricing("price", {
                cost,
                price: parseMoneyInput(e.target.value),
                marginPercent: marginPct,
                markupPercent: markupPct,
              });
              pushSnapshot(next);
            }}
            className="rounded border border-[#E5EAF2] p-2 outline-none focus:border-[#4A90E2]"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 rounded-md bg-gray-50 p-3 text-sm">
        <div className="flex flex-col">
          <label className="mb-1 text-xs text-[#6B7280]">Markup %</label>
          <input
            type="number"
            step="0.01"
            value={markupPct === null ? "" : markupPct}
            onChange={(e) => {
              const next = reconcilePricing("markup", {
                cost,
                price,
                marginPercent: marginPct,
                markupPercent: parsePercentInput(e.target.value),
              });
              pushSnapshot(next);
            }}
            className="rounded border border-[#E5EAF2] bg-white p-2 text-sm outline-none focus:border-[#4A90E2]"
          />
          <p className="mt-1 text-[10px] text-gray-500">(Price − Cost) ÷ Cost × 100</p>
        </div>
        <div className="flex flex-col">
          <label className="mb-1 text-xs text-[#6B7280]">Margin %</label>
          <input
            type="number"
            step="0.01"
            value={marginPct === null ? "" : marginPct}
            onChange={(e) => {
              const next = reconcilePricing("margin", {
                cost,
                price,
                marginPercent: parsePercentInput(e.target.value),
                markupPercent: markupPct,
              });
              pushSnapshot(next);
            }}
            className="rounded border border-[#E5EAF2] bg-white p-2 text-sm outline-none focus:border-[#4A90E2]"
          />
          <p className="mt-1 text-[10px] text-gray-500">(Price − Cost) ÷ Price × 100</p>
        </div>
      </div>
    </>
  );
}
