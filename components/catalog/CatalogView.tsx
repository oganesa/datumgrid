"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CatalogGroupBlock, CatalogItemRow } from "@/lib/catalog-shared";
import { formatPct, formatUsd } from "./format";
import EditCostItemDrawer from "./EditCostItemDrawer";

type Props = {
  groups: CatalogGroupBlock[];
};

export default function CatalogView({ groups }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const g of groups) init[g._id] = true;
    return init;
  });

  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev };
      for (const g of groups) {
        if (next[g._id] === undefined) next[g._id] = true;
      }
      return next;
    });
  }, [groups]);
  const [editItem, setEditItem] = useState<CatalogItemRow | null>(null);

  const totalItems = useMemo(
    () => groups.reduce((n, g) => n + g.items.length, 0),
    [groups]
  );

  function toggleGroup(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="space-y-4">
      {groups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#E5EAF2] bg-white p-8 text-center text-gray-500">
          <p className="font-medium text-gray-700">No cost groups yet</p>
          <p className="mt-2 text-sm">
            Use <strong>New cost group</strong> and <strong>New cost item</strong> in the header to
            build your catalog.
          </p>
        </div>
      ) : null}

      {totalItems === 0 && groups.length > 0 ? (
        <p className="text-sm text-amber-800">
          You have groups but no line items yet. Add a <strong>New cost item</strong>.
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-[#E5EAF2] bg-white shadow-sm">
        <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#E5EAF2] bg-[#F8F8F8] text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              <th className="px-3 py-3">ID</th>
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Description</th>
              <th className="px-3 py-3 text-right">Qty</th>
              <th className="px-3 py-3">UOM</th>
              <th className="px-3 py-3 text-right">Unit cost</th>
              <th className="px-3 py-3 text-right">Unit price</th>
              <th className="px-3 py-3 text-right">Markup</th>
              <th className="px-3 py-3 text-right">Margin</th>
              <th className="px-3 py-3 text-right">Extended cost</th>
              <th className="px-3 py-3 text-right">Extended price</th>
              <th className="px-3 py-3">SKU</th>
              <th className="px-3 py-3 text-center">Taxable</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <React.Fragment key={group._id}>
                <tr className="bg-[#EBF3FF]/60">
                  <td colSpan={13} className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group._id)}
                      className="flex w-full items-center gap-2 text-left font-semibold text-[#4A90E2]"
                    >
                      <span className="inline-block w-4 text-center">
                        {expanded[group._id] ? "▼" : "▶"}
                      </span>
                      {group.name}
                      <span className="text-xs font-normal text-gray-600">
                        ({group.items.length} item{group.items.length === 1 ? "" : "s"})
                      </span>
                    </button>
                  </td>
                </tr>
                {expanded[group._id]
                  ? group.items.map((row) => (
                      <tr
                        key={row._id}
                        className="cursor-pointer border-b border-[#EEEEEE] hover:bg-[#F5FBFF]"
                        onClick={() => setEditItem(row)}
                      >
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">
                          {row.displayId}
                        </td>
                        <td className="max-w-[180px] truncate px-3 py-2 font-medium">
                          {row.name}
                        </td>
                        <td className="max-w-[200px] truncate px-3 py-2 text-gray-600">
                          {row.description || "—"}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">1</td>
                        <td className="whitespace-nowrap px-3 py-2">{row.uom}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatUsd(row.unitCost)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatUsd(row.unitPrice)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-gray-700">
                          {formatPct(row.markupPercent)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-gray-700">
                          {formatPct(row.marginPercent)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatUsd(row.extendedCost)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatUsd(row.extendedPrice)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-gray-600">
                          {row.sku || "—"}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {row.taxable ? (
                            <span className="text-green-600">Yes</span>
                          ) : (
                            <span className="text-gray-400">No</span>
                          )}
                        </td>
                      </tr>
                    ))
                  : null}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500">
        Click a row to edit. Markup = (Price − Cost) ÷ Cost × 100. Margin = (Price − Cost) ÷ Price ×
        100.
      </p>

      <EditCostItemDrawer
        item={editItem}
        open={editItem != null}
        onClose={() => setEditItem(null)}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
