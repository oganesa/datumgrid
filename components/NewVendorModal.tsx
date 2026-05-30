"use client";

import React from "react";

import { createVendor } from "@/actions/vendorActions";
import UsAddressFields from "@/components/UsAddressFields";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function NewVendorModal({ isOpen, onClose, onSuccess }: Props) {
  if (!isOpen) return null;

  async function onSubmitForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = await createVendor(formData);
    if (result.success) {
      onSuccess?.();
      onClose();
      e.currentTarget.reset();
    } else {
      alert(result.error);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-8 max-h-[min(90vh,900px)] w-full max-w-2xl overflow-y-auto rounded-lg bg-white font-arial shadow-xl">
        <div className="flex items-center justify-between bg-[#0099FF] p-4 text-white">
          <h2 className="font-bold uppercase tracking-tight">New vendor</h2>
          <button type="button" onClick={onClose} className="hover:text-gray-200">
            ✕
          </button>
        </div>

        <form onSubmit={onSubmitForm} className="space-y-4 p-6">
          <div className="flex flex-col">
            <label className="mb-1 text-xs text-[#808080]">Vendor *</label>
            <input
              name="name"
              required
              type="text"
              className="rounded border border-[#D5D5D5] p-2 outline-none focus:border-[#0099FF]"
              placeholder="Company or contact name"
            />
          </div>

          <div className="border-t border-[#D5D5D5] pt-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#808080]">
              Address
            </h3>
            <UsAddressFields />
          </div>

          <div className="border-t border-[#D5D5D5] pt-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#808080]">
              Contact
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col">
                <label className="mb-1 text-xs text-[#808080]">Phone number</label>
                <input
                  name="phone"
                  type="tel"
                  className="rounded border border-[#D5D5D5] p-2 outline-none focus:border-[#0099FF]"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-xs text-[#808080]">Email</label>
                <input
                  name="email"
                  type="email"
                  className="rounded border border-[#D5D5D5] p-2 outline-none focus:border-[#0099FF]"
                />
              </div>
              <div className="flex flex-col sm:col-span-2">
                <label className="mb-1 text-xs text-[#808080]">Web</label>
                <input
                  name="web"
                  type="text"
                  className="rounded border border-[#D5D5D5] p-2 outline-none focus:border-[#0099FF]"
                  placeholder="https://example.com"
                />
              </div>
            </div>
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
              Save vendor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
