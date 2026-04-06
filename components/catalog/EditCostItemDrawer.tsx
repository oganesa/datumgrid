"use client";

import React, { useEffect, useState } from "react";
import { listCostGroups, updateCostItem } from "@/actions/catalogActions";
import type { CatalogItemRow } from "@/lib/catalog-shared";
import CatalogPricingFields from "./CatalogPricingFields";

const UOM_OPTIONS = [
  "Each",
  "SF",
  "LF",
  "CY",
  "HR",
  "Day",
  "Lot",
  "EA",
  "Other",
];

type GroupOpt = { _id: string; name: string };

type Props = {
  item: CatalogItemRow | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function EditCostItemDrawer({
  item,
  open,
  onClose,
  onSuccess,
}: Props) {
  const [groups, setGroups] = useState<GroupOpt[]>([]);
  const [unitCost, setUnitCost] = useState(0);
  const [unitPrice, setUnitPrice] = useState(0);

  const setPricing = React.useCallback(
    (v: { cost: number; price: number }) => {
      setUnitCost(v.cost);
      setUnitPrice(v.price);
    },
    []
  );

  useEffect(() => {
    if (open) listCostGroups().then(setGroups);
  }, [open]);

  useEffect(() => {
    if (item) {
      setUnitCost(item.unitCost);
      setUnitPrice(item.unitPrice);
    }
  }, [item]);

  if (!open || !item) return null;

  async function onSubmitForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!item) return;
    const formData = new FormData(e.currentTarget);
    formData.set("id", item._id);
    formData.set("unitCost", String(unitCost));
    formData.set("unitPrice", String(unitPrice));
    const result = await updateCostItem(formData);
    if (result.success) {
      onSuccess?.();
      onClose();
    } else {
      alert(result.error);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close panel"
        className="fixed inset-0 z-[55] bg-black/30"
        onClick={onClose}
      />
      <aside className="fixed right-0 top-0 z-[56] flex h-full w-full max-w-md flex-col border-l border-[#D5D5D5] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#D5D5D5] bg-[#0099FF] p-4 text-white">
          <h2 className="font-bold uppercase tracking-tight">Update cost item</h2>
          <button type="button" onClick={onClose} className="hover:text-gray-200">
            Close
          </button>
        </div>
        <div className="border-b border-[#D5D5D5] bg-[#D5EEFF] p-3 text-xs text-gray-800">
          Catalog ID <strong>{item.displayId}</strong> — changes apply everywhere this item is used.
        </div>
        <form
          onSubmit={onSubmitForm}
          className="flex flex-1 flex-col gap-4 overflow-y-auto p-4"
        >
          <div className="flex flex-col">
            <label className="mb-1 text-xs text-[#808080]">Cost group *</label>
            <select
              name="costGroupId"
              required
              defaultValue={item.costGroupId}
              className="rounded border border-[#D5D5D5] p-2 outline-none focus:border-[#0099FF]"
            >
              {groups.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-xs text-[#808080]">Name *</label>
            <input
              name="name"
              required
              type="text"
              defaultValue={item.name}
              className="rounded border border-[#D5D5D5] p-2 outline-none focus:border-[#0099FF]"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-xs text-[#808080]">Description</label>
            <textarea
              name="description"
              rows={3}
              defaultValue={item.description}
              className="rounded border border-[#D5D5D5] p-2 outline-none focus:border-[#0099FF]"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-xs text-[#808080]">UOM *</label>
            <select
              name="uom"
              required
              defaultValue={item.uom}
              className="rounded border border-[#D5D5D5] p-2 outline-none focus:border-[#0099FF]"
            >
              {UOM_OPTIONS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <CatalogPricingFields
            initialCost={item.unitCost}
            initialPrice={item.unitPrice}
            onValuesChange={setPricing}
          />
          <div className="flex flex-col">
            <label className="mb-1 text-xs text-[#808080]">SKU</label>
            <input
              name="sku"
              type="text"
              defaultValue={item.sku}
              className="rounded border border-[#D5D5D5] p-2 outline-none focus:border-[#0099FF]"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              name="taxable"
              type="checkbox"
              defaultChecked={item.taxable}
              className="h-4 w-4 rounded border-gray-300"
            />
            Taxable
          </label>
          <div className="mt-auto flex justify-end gap-3 border-t border-[#D5D5D5] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-4 py-2 text-[#808080] hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-[#0099FF] px-6 py-2 font-bold text-white shadow-md hover:bg-[#2AAAFF]"
            >
              Update
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
