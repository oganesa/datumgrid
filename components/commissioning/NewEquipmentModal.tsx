"use client";

import React from "react";

import { createCommissioningEquipment } from "@/actions/commissioningEquipmentActions";

type ProjectOption = { _id: string; name: string; number: string };
type CustomerOption = { _id: string; name: string };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** When set, equipment is created for this project (no project picker). */
  fixedProjectId?: string;
  /** Required when `fixedProjectId` is not set — used to populate project dropdown. */
  projects?: ProjectOption[];
  /** Customers from the Customers module (optional link on each equipment row). */
  customers?: CustomerOption[];
};

const inputPlain =
  "w-full rounded border border-[#D5D5D5] p-2 text-sm outline-none focus:border-[#0099FF]";
const inputWithIcon =
  "w-full rounded border border-[#D5D5D5] py-2 pl-2 pr-9 text-sm outline-none focus:border-[#0099FF]";
const labelRequired =
  "mb-1 block border-l-4 border-red-500 pl-2 text-xs font-medium text-gray-700";
const labelOptional = "mb-1 block pl-2 text-xs font-medium text-gray-700";

function IconSearch() {
  return (
    <svg
      className="h-4 w-4 text-gray-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg
      className="h-4 w-4 text-gray-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg
      className="h-4 w-4 text-gray-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function InputTrailing({
  id,
  name,
  required,
  placeholder,
  icon,
}: {
  id: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        required={required}
        type="text"
        placeholder={placeholder}
        className={inputWithIcon}
      />
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
        {icon}
      </span>
    </div>
  );
}

export default function NewEquipmentModal({
  isOpen,
  onClose,
  onSuccess,
  fixedProjectId,
  projects = [],
  customers = [],
}: Props) {
  if (!isOpen) return null;

  const showProjectPicker = !fixedProjectId;

  async function onSubmitForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await createCommissioningEquipment(formData);
    if (result.success) {
      form.reset();
      onSuccess?.();
      onClose();
    } else {
      alert(result.error);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-6 max-h-[min(92vh,920px)] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#D5D5D5] bg-white px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Create equipment</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmitForm} className="space-y-6 p-5 sm:p-6">
          {fixedProjectId ? (
            <input type="hidden" name="projectId" value={fixedProjectId} />
          ) : (
            <div>
              <label className={labelRequired} htmlFor="equipment-project">
                Project *
              </label>
              <select
                id="equipment-project"
                name="projectId"
                required
                className={inputPlain}
                defaultValue=""
              >
                <option value="" disabled>
                  Select project
                </option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.number} — {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <section>
            <h3 className="mb-4 border-b border-gray-200 pb-2 text-sm font-semibold text-gray-800">
              Asset details
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelRequired} htmlFor="assetName">
                  Asset name *
                </label>
                <input
                  id="assetName"
                  name="assetName"
                  required
                  type="text"
                  className={inputPlain}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelOptional} htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="w-full rounded border border-[#D5D5D5] p-2 text-sm outline-none focus:border-[#0099FF]"
                />
              </div>
              <div>
                <label className={labelOptional} htmlFor="assetNumber">
                  Asset number
                </label>
                <input
                  id="assetNumber"
                  name="assetNumber"
                  type="text"
                  className={inputPlain}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelRequired} htmlFor="serviceAndPart">
                  Service and part *
                </label>
                <InputTrailing
                  id="serviceAndPart"
                  name="serviceAndPart"
                  required
                  placeholder="Search service and part"
                  icon={<IconSearch />}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelOptional} htmlFor="parentAsset">
                  Parent asset
                </label>
                <InputTrailing
                  id="parentAsset"
                  name="parentAsset"
                  placeholder="Search parent asset"
                  icon={<IconSearch />}
                />
              </div>
              <div>
                <label className={labelOptional} htmlFor="giai">
                  GIAI
                </label>
                <input
                  id="giai"
                  name="giai"
                  type="text"
                  className={inputPlain}
                />
              </div>
              <div />
              <div>
                <label className={labelOptional} htmlFor="orderedDate">
                  Ordered date
                </label>
                <input
                  id="orderedDate"
                  name="orderedDate"
                  type="date"
                  className={inputPlain}
                />
              </div>
              <div>
                <label className={labelOptional} htmlFor="installationDate">
                  Installation date
                </label>
                <input
                  id="installationDate"
                  name="installationDate"
                  type="date"
                  className={inputPlain}
                />
              </div>
              <div>
                <label className={labelOptional} htmlFor="purchasedDate">
                  Purchased date
                </label>
                <input
                  id="purchasedDate"
                  name="purchasedDate"
                  type="date"
                  className={inputPlain}
                />
              </div>
              <div>
                <label className={labelOptional} htmlFor="warrantyExpiration">
                  Warranty expiration
                </label>
                <input
                  id="warrantyExpiration"
                  name="warrantyExpiration"
                  type="date"
                  className={inputPlain}
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-4 border-b border-gray-200 pb-2 text-sm font-semibold text-gray-800">
              Contact details
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelOptional} htmlFor="customerId">
                  Customer
                </label>
                <select
                  id="customerId"
                  name="customerId"
                  className={inputPlain}
                  defaultValue=""
                >
                  <option value="">None</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {customers.length === 0 ? (
                  <p className="mt-1 text-xs text-gray-500">
                    Add customers under Customers to link them here.
                  </p>
                ) : null}
              </div>
              <div className="sm:col-span-2">
                <label className={labelRequired} htmlFor="contact">
                  Contact *
                </label>
                <InputTrailing
                  id="contact"
                  name="contact"
                  required
                  placeholder="Search contact"
                  icon={<IconUser />}
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-4 border-b border-gray-200 pb-2 text-sm font-semibold text-gray-800">
              Address
            </h3>
            <div>
              <label className={labelOptional} htmlFor="address">
                Address
              </label>
              <InputTrailing id="address" name="address" icon={<IconPin />} />
            </div>
          </section>

          <div className="flex justify-end gap-3 border-t border-[#D5D5D5] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[#D5D5D5] bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-[#0099FF] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#2AAAFF]"
            >
              Save equipment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
