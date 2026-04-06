import {
  computeMarginPercent,
  computeMarkupPercent,
} from "@/lib/catalog-shared";

export type PricingEditSource = "cost" | "price" | "margin" | "markup";

export type PricingSnapshot = {
  cost: number;
  price: number;
  marginPercent: number | null;
  markupPercent: number | null;
};

function roundMoney(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

function roundPct(n: number | null): number | null {
  if (n == null || !Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}

/**
 * After the user edits one of cost, price, margin %, or markup %, derive the
 * other fields. Persisted values remain unit cost and unit price; percents are
 * derived when both money fields are consistent, with fallbacks while inputs
 * are incomplete.
 */
export function reconcilePricing(
  source: PricingEditSource,
  state: {
    cost: number;
    price: number;
    marginPercent: number | null;
    markupPercent: number | null;
  }
): PricingSnapshot {
  let { cost, price, marginPercent, markupPercent } = state;

  const mValid =
    marginPercent !== null &&
    Number.isFinite(marginPercent) &&
    marginPercent < 100;
  const mkValid =
    markupPercent !== null &&
    Number.isFinite(markupPercent) &&
    markupPercent > -100;

  switch (source) {
    case "cost":
      if (price > 0 && cost >= 0) {
        /* percents finalized below */
      } else if (mValid && cost >= 0) {
        const denom = 1 - marginPercent! / 100;
        if (denom > 0) price = roundMoney(cost / denom);
      } else if (mkValid && cost > 0) {
        price = roundMoney(cost * (1 + markupPercent! / 100));
      }
      break;
    case "price":
      if (cost >= 0 && price > 0) {
        /* percents finalized below */
      } else if (mValid && price > 0) {
        cost = roundMoney(price * (1 - marginPercent! / 100));
        if (cost < 0) cost = 0;
      } else if (mkValid && price > 0) {
        const denom = 1 + markupPercent! / 100;
        if (denom > 0) cost = roundMoney(price / denom);
      }
      break;
    case "margin":
      if (mValid) {
        if (cost > 0) {
          const denom = 1 - marginPercent! / 100;
          if (denom > 0) price = roundMoney(cost / denom);
        } else if (price > 0) {
          cost = roundMoney(price * (1 - marginPercent! / 100));
          if (cost < 0) cost = 0;
        }
      }
      break;
    case "markup":
      if (mkValid) {
        if (cost > 0) {
          price = roundMoney(cost * (1 + markupPercent! / 100));
        } else if (price > 0) {
          const denom = 1 + markupPercent! / 100;
          if (denom > 0) cost = roundMoney(price / denom);
        }
      }
      break;
  }

  cost = roundMoney(cost);
  price = roundMoney(price);

  let mOut = marginPercent;
  let mkOut = markupPercent;
  if (price > 0) {
    mOut = computeMarginPercent(cost, price);
  }
  if (cost > 0) {
    mkOut = computeMarkupPercent(cost, price);
  }

  return {
    cost,
    price,
    marginPercent: roundPct(mOut),
    markupPercent: roundPct(mkOut),
  };
}
