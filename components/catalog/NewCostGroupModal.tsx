"use client";

import React from "react";
import { createCostGroup } from "@/actions/catalogActions";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function NewCostGroupModal({
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  if (!isOpen) return null;

  async function onSubmitForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = await createCostGroup(formData);
    if (result.success) {
      onSuccess?.();
      onClose();
      e.currentTarget.reset();
    } else {
      alert(result.error);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between bg-[#0099FF] p-4 text-white">
          <h2 className="font-bold uppercase tracking-tight">New cost group</h2>
          <button type="button" onClick={onClose} className="hover:text-gray-200">
            ✕
          </button>
        </div>
        <form onSubmit={onSubmitForm} className="space-y-4 p-6">
          <div className="flex flex-col">
            <label className="mb-1 text-xs text-[#808080]">Name *</label>
            <input
              name="name"
              required
              type="text"
              className="rounded border border-[#D5D5D5] p-2 outline-none focus:border-[#0099FF]"
              placeholder="e.g. Preconstruction"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-xs text-[#808080]">Description</label>
            <textarea
              name="description"
              rows={3}
              className="rounded border border-[#D5D5D5] p-2 outline-none focus:border-[#0099FF]"
            />
          </div>
          <div className="flex justify-end gap-3 border-t border-[#D5D5D5] pt-4">
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
              Save group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
