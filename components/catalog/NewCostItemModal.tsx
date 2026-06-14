"use client";

import React, { useEffect, useState } from "react";
import { createCostItem, listCostGroups } from "@/actions/catalogActions";
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
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function NewCostItemModal({
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [groups, setGroups] = useState<GroupOpt[]>([]);
  const [pricing, setPricing] = useState({ cost: 0, price: 0 });
  const [pricingKey, setPricingKey] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    listCostGroups().then(setGroups);
  }, [isOpen]);

  if (!isOpen) return null;

  async function onSubmitForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("unitCost", String(pricing.cost));
    formData.set("unitPrice", String(pricing.price));
    const result = await createCostItem(formData);
    if (result.success) {
      onSuccess?.();
      onClose();
      e.currentTarget.reset();
      setPricingKey((k) => k + 1);
      setPricing({ cost: 0, price: 0 });
    } else {
      alert(result.error);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between bg-[#4A90E2] p-4 text-white">
          <h2 className="font-bold uppercase tracking-tight">New cost item</h2>
          <button type="button" onClick={onClose} className="hover:text-gray-200">
            ✕
          </button>
        </div>
        <form onSubmit={onSubmitForm} className="space-y-4 p-6">
          <p className="rounded-md bg-[#EBF3FF] p-3 text-xs text-gray-700">
            A unique 6-digit catalog ID is assigned automatically when you save.
          </p>
          <div className="flex flex-col">
            <label className="mb-1 text-xs text-[#6B7280]">Cost group *</label>
            <select
              name="costGroupId"
              required
              className="rounded border border-[#E5EAF2] p-2 outline-none focus:border-[#4A90E2]"
            >
              <option value="">Select group</option>
              {groups.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </select>
            {groups.length === 0 ? (
              <p className="mt-1 text-xs text-amber-700">
                Create a cost group first.
              </p>
            ) : null}
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-xs text-[#6B7280]">Name *</label>
            <input
              name="name"
              required
              type="text"
              className="rounded border border-[#E5EAF2] p-2 outline-none focus:border-[#4A90E2]"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-xs text-[#6B7280]">Description</label>
            <textarea
              name="description"
              rows={2}
              className="rounded border border-[#E5EAF2] p-2 outline-none focus:border-[#4A90E2]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="mb-1 text-xs text-[#6B7280]">UOM *</label>
              <select
                name="uom"
                required
                defaultValue="Each"
                className="rounded border border-[#E5EAF2] p-2 outline-none focus:border-[#4A90E2]"
              >
                {UOM_OPTIONS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-xs text-[#6B7280]">SKU</label>
              <input
                name="sku"
                type="text"
                className="rounded border border-[#E5EAF2] p-2 outline-none focus:border-[#4A90E2]"
              />
            </div>
          </div>
          <CatalogPricingFields
            key={pricingKey}
            initialCost={0}
            initialPrice={0}
            onValuesChange={setPricing}
          />
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input name="taxable" type="checkbox" className="h-4 w-4 rounded border-gray-300" />
            Taxable
          </label>
          <div className="flex justify-end gap-3 border-t border-[#E5EAF2] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-4 py-2 text-[#6B7280] hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-[#4A90E2] px-6 py-2 font-bold text-white shadow-md hover:bg-[#7FB3FF]"
            >
              Save item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
