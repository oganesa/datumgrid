/** Client-safe catalog types and calculations (no MongoDB). */

export type CatalogItemRow = {
  _id: string;
  costGroupId: string;
  catalogNumber: number;
  displayId: string;
  name: string;
  description: string;
  uom: string;
  unitCost: number;
  unitPrice: number;
  sku: string;
  taxable: boolean;
  markupPercent: number | null;
  marginPercent: number | null;
  extendedCost: number;
  extendedPrice: number;
};

export type CatalogGroupBlock = {
  _id: string;
  name: string;
  description: string;
  items: CatalogItemRow[];
};

export function computeMarkupPercent(
  unitCost: number,
  unitPrice: number
): number | null {
  if (unitCost <= 0) return null;
  return ((unitPrice - unitCost) / unitCost) * 100;
}

export function computeMarginPercent(
  unitCost: number,
  unitPrice: number
): number | null {
  if (unitPrice <= 0) return null;
  return ((unitPrice - unitCost) / unitPrice) * 100;
}
