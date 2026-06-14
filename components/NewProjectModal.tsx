"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";

import { createProject } from "@/actions/projectActions";
import {
  listCustomersForProjectForm,
  type CustomerOption,
} from "@/actions/customerActions";
import NewCustomerModal from "@/components/NewCustomerModal";
import UsAddressFields from "@/components/UsAddressFields";

const ADD_NEW_CUSTOMER = "__add_new_customer__";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function NewProjectModal({ isOpen, onClose }: Props) {
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);

  const refreshCustomers = useCallback(async () => {
    try {
      setLoadError(null);
      const rows = await listCustomersForProjectForm();
      setCustomers(rows);
    } catch {
      setLoadError("Could not load customers.");
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    refreshCustomers();
  }, [isOpen, refreshCustomers]);

  if (!isOpen) return null;

  async function onSubmitForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = await createProject(formData);
    if (result.success) {
      onClose();
      e.currentTarget.reset();
      setCustomerId("");
    } else {
      alert(result.error);
    }
  }

  function onCustomerSelectChange(next: string) {
    if (next === ADD_NEW_CUSTOMER) {
      setAddCustomerOpen(true);
      return;
    }
    setCustomerId(next);
  }

  function onNewCustomerSaved(newId?: string) {
    void refreshCustomers().then(() => {
      if (newId) setCustomerId(newId);
    });
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
        <div className="my-8 max-h-[min(90vh,900px)] w-full max-w-2xl overflow-y-auto rounded-lg bg-white font-arial shadow-xl">
          <div className="flex items-center justify-between bg-[#4A90E2] p-4 text-white">
            <h2 className="font-bold uppercase tracking-tight">Create New Project</h2>
            <button type="button" onClick={onClose} className="hover:text-gray-200">
              ✕
            </button>
          </div>

          <form onSubmit={onSubmitForm} className="space-y-4 p-6">
            <input type="hidden" name="customerId" value={customerId} />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="mb-1 text-xs text-[#6B7280]">Project Name*</label>
                <input
                  name="name"
                  required
                  type="text"
                  className="rounded border border-[#E5EAF2] p-2 outline-none focus:border-[#4A90E2]"
                  placeholder="e.g. World Youth Festival"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-xs text-[#6B7280]">Project Number*</label>
                <input
                  name="number"
                  required
                  type="text"
                  className="rounded border border-[#E5EAF2] p-2 outline-none focus:border-[#4A90E2]"
                  placeholder="SE-1"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-xs text-[#6B7280]">Description</label>
              <textarea
                name="description"
                className="h-24 rounded border border-[#E5EAF2] p-2 outline-none focus:border-[#4A90E2]"
                placeholder="Project details..."
              />
            </div>

            <div className="border-t border-[#E5EAF2] pt-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Customer &amp; site
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col sm:col-span-2">
                  <label className="mb-1 text-xs text-[#6B7280]">Customer</label>
                  <select
                    value={customerId}
                    onChange={(e) => onCustomerSelectChange(e.target.value)}
                    className="rounded border border-[#E5EAF2] bg-white p-2 outline-none focus:border-[#4A90E2]"
                  >
                    <option value="">— Select customer —</option>
                    {customers.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                    <option value={ADD_NEW_CUSTOMER}>+ Add new customer…</option>
                  </select>
                  {loadError ? (
                    <p className="mt-1 text-xs text-red-600">{loadError}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-gray-500">
                    Manage all customers under{" "}
                    <Link href="/customers" className="text-[#4A90E2] hover:underline">
                      Customer
                    </Link>{" "}
                    in the sidebar.
                  </p>
                </div>
                <UsAddressFields />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="mb-1 text-xs text-[#6B7280]">Start Date</label>
                <input name="startDate" type="date" className="rounded border border-[#E5EAF2] p-2" />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-xs text-[#6B7280]">End Date</label>
                <input name="endDate" type="date" className="rounded border border-[#E5EAF2] p-2" />
              </div>
            </div>

            <div className="flex justify-end space-x-3 border-t border-[#E5EAF2] pt-4">
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
                SAVE PROJECT
              </button>
            </div>
          </form>
        </div>
      </div>

      <NewCustomerModal
        isOpen={addCustomerOpen}
        onClose={() => setAddCustomerOpen(false)}
        onSuccess={onNewCustomerSaved}
      />
    </>
  );
}
