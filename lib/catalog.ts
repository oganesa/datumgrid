import { connectDB } from "@/lib/mongodb";
import CostGroup from "@/models/CostGroup";
import CostItem from "@/models/CostItem";
import type { CatalogGroupBlock, CatalogItemRow } from "@/lib/catalog-shared";
import { computeMarginPercent, computeMarkupPercent } from "@/lib/catalog-shared";

export type { CatalogGroupBlock, CatalogItemRow } from "@/lib/catalog-shared";
export {
  computeMarginPercent,
  computeMarkupPercent,
} from "@/lib/catalog-shared";

function toRow(
  doc: {
    _id: unknown;
    costGroup: unknown;
    catalogNumber?: number;
    name: string;
    description?: string;
    uom: string;
    unitCost: number;
    unitPrice: number;
    sku?: string;
    taxable?: boolean;
  },
  qty = 1
): CatalogItemRow {
  const unitCost = Number(doc.unitCost) || 0;
  const unitPrice = Number(doc.unitPrice) || 0;
  const num = doc.catalogNumber ?? 0;
  return {
    _id: String(doc._id),
    costGroupId: String(doc.costGroup),
    catalogNumber: num,
    displayId: String(num).padStart(6, "0"),
    name: doc.name,
    description: doc.description ?? "",
    uom: doc.uom,
    unitCost,
    unitPrice,
    sku: doc.sku ?? "",
    taxable: Boolean(doc.taxable),
    markupPercent: computeMarkupPercent(unitCost, unitPrice),
    marginPercent: computeMarginPercent(unitCost, unitPrice),
    extendedCost: unitCost * qty,
    extendedPrice: unitPrice * qty,
  };
}

export async function getCatalogGrouped(): Promise<CatalogGroupBlock[]> {
  await connectDB();
  const groups = await CostGroup.find().sort({ sortOrder: 1, name: 1 }).lean();
  const items = await CostItem.find()
    .sort({ catalogNumber: 1 })
    .lean();

  const byGroup = new Map<string, typeof items>();
  for (const it of items) {
    const gid = String(it.costGroup);
    if (!byGroup.has(gid)) byGroup.set(gid, []);
    byGroup.get(gid)!.push(it);
  }

  return groups.map((g) => ({
    _id: String(g._id),
    name: g.name,
    description: g.description ?? "",
    items: (byGroup.get(String(g._id)) ?? []).map((it) => toRow(it)),
  }));
}
