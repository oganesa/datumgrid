"use client";

import { useEffect, useState } from "react";

import { updateCommissioningEquipment } from "@/actions/commissioningEquipmentActions";
import type { SerializedCommissioningEquipment } from "@/lib/commissioning-equipment";

import AiVerificationPanel from "./AiVerificationPanel";
import ContactPicker from "./ContactPicker";
import type { ContactOption } from "./ContactPicker";
import EquipmentChecklistPanel from "./EquipmentChecklistPanel";
import EquipmentGuidancePanel from "./EquipmentGuidancePanel";
import { formatTableDate } from "./format";
import ParentAssetPicker from "./ParentAssetPicker";

type TabId = "checklist" | "ai" | "guidance" | "details";
type CustomerOption = { _id: string; name: string };
type AssetTypeOption = { _id: string; typeCode: string; typeName: string };

function dash(s: string | null | undefined) {
  return s?.trim() ? s : "—";
}

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

const inputPlain =
  "w-full rounded border border-[#D5D5D5] p-2 text-sm outline-none focus:border-[#0099FF]";
const labelRequired =
  "mb-1 block border-l-4 border-red-500 pl-2 text-xs font-medium text-gray-700";
const labelOptional = "mb-1 block pl-2 text-xs font-medium text-gray-700";

function ReadOnlyDetails({
  equipment,
}: {
  equipment: SerializedCommissioningEquipment;
}) {
  return (
    <div className="space-y-3">
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Record details
        </h3>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gray-500">Asset type</dt>
            <dd className="font-medium text-gray-900">
              {equipment.assetTypeCode && equipment.assetTypeName
                ? `${equipment.assetTypeCode} — ${equipment.assetTypeName}`
                : dash(equipment.assetTypeName ?? equipment.assetTypeCode)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">GIAI</dt>
            <dd className="font-medium text-gray-900">{dash(equipment.giai)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Parent asset</dt>
            <dd className="font-medium text-gray-900">
              {dash(equipment.parentAssetName)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Customer</dt>
            <dd className="font-medium text-gray-900">
              {dash(equipment.customerName)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Contact person</dt>
            <dd className="font-medium text-gray-900">
              {equipment.contactPersonName
                ? <>
                    <span>{equipment.contactPersonName}</span>
                    {(equipment.contactPersonEmail || equipment.contactPersonPhone) && (
                      <span className="ml-2 text-xs font-normal text-gray-500">
                        {[equipment.contactPersonEmail, equipment.contactPersonPhone].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </>
                : "—"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-gray-500">Description</dt>
            <dd className="font-medium text-gray-900">
              {dash(equipment.description)}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-gray-500">Address</dt>
            <dd className="font-medium text-gray-900">{dash(equipment.address)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Ordered</dt>
            <dd className="font-medium text-gray-900">
              {formatTableDate(equipment.orderedDate)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Installation</dt>
            <dd className="font-medium text-gray-900">
              {formatTableDate(equipment.installationDate)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Purchased</dt>
            <dd className="font-medium text-gray-900">
              {formatTableDate(equipment.purchasedDate)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Warranty expiration</dt>
            <dd className="font-medium text-gray-900">
              {formatTableDate(equipment.warrantyExpiration)}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

function EditForm({
  equipment,
  customers,
  assetTypes,
  contacts,
  parentAssetOptions,
  onSaved,
  onCancel,
}: {
  equipment: SerializedCommissioningEquipment;
  customers: CustomerOption[];
  assetTypes: AssetTypeOption[];
  contacts: ContactOption[];
  parentAssetOptions: { _id: string; assetName: string }[];
  onSaved?: () => void;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await updateCommissioningEquipment(equipment._id, formData);
    setSaving(false);
    if (result.success) {
      onSaved?.();
    } else {
      setError(result.error);
    }
  }

  return (
    <form key={equipment._id} onSubmit={handleSubmit} className="space-y-6">
      <section>
        <h3 className="mb-4 border-b border-gray-200 pb-2 text-sm font-semibold text-gray-800">
          Asset details
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelRequired} htmlFor="edit-assetName">
              Asset name *
            </label>
            <input
              id="edit-assetName"
              name="assetName"
              required
              type="text"
              defaultValue={equipment.assetName}
              className={inputPlain}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelOptional} htmlFor="edit-description">
              Description
            </label>
            <textarea
              id="edit-description"
              name="description"
              rows={3}
              defaultValue={equipment.description ?? ""}
              className="w-full rounded border border-[#D5D5D5] p-2 text-sm outline-none focus:border-[#0099FF]"
            />
          </div>
          <div>
            <label className={labelOptional} htmlFor="edit-assetNumber">
              Asset number
            </label>
            <input
              id="edit-assetNumber"
              name="assetNumber"
              type="text"
              defaultValue={equipment.assetNumber ?? ""}
              className={inputPlain}
            />
          </div>
          <div>
            <label className={labelOptional} htmlFor="edit-assetTypeId">
              Asset type
            </label>
            <select
              id="edit-assetTypeId"
              name="assetTypeId"
              defaultValue={equipment.assetTypeId ?? ""}
              className={inputPlain}
            >
              <option value="">None</option>
              {assetTypes.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.typeCode} — {t.typeName}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelRequired} htmlFor="edit-serviceAndPart">
              Service and part *
            </label>
            <input
              id="edit-serviceAndPart"
              name="serviceAndPart"
              required
              type="text"
              defaultValue={equipment.serviceAndPart}
              className={inputPlain}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelOptional}>Parent asset</label>
            <ParentAssetPicker
              name="parentAssetId"
              options={parentAssetOptions}
              defaultAssetId={equipment.parentAssetId}
              defaultAssetName={equipment.parentAssetName}
            />
          </div>
          <div>
            <label className={labelOptional} htmlFor="edit-giai">
              GIAI
            </label>
            <input
              id="edit-giai"
              name="giai"
              type="text"
              defaultValue={equipment.giai ?? ""}
              className={inputPlain}
            />
          </div>
          <div />
          <div>
            <label className={labelOptional} htmlFor="edit-orderedDate">
              Ordered date
            </label>
            <input
              id="edit-orderedDate"
              name="orderedDate"
              type="date"
              defaultValue={toDateInput(equipment.orderedDate)}
              className={inputPlain}
            />
          </div>
          <div>
            <label className={labelOptional} htmlFor="edit-installationDate">
              Installation date
            </label>
            <input
              id="edit-installationDate"
              name="installationDate"
              type="date"
              defaultValue={toDateInput(equipment.installationDate)}
              className={inputPlain}
            />
          </div>
          <div>
            <label className={labelOptional} htmlFor="edit-purchasedDate">
              Purchased date
            </label>
            <input
              id="edit-purchasedDate"
              name="purchasedDate"
              type="date"
              defaultValue={toDateInput(equipment.purchasedDate)}
              className={inputPlain}
            />
          </div>
          <div>
            <label className={labelOptional} htmlFor="edit-warrantyExpiration">
              Warranty expiration
            </label>
            <input
              id="edit-warrantyExpiration"
              name="warrantyExpiration"
              type="date"
              defaultValue={toDateInput(equipment.warrantyExpiration)}
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
            <label className={labelOptional} htmlFor="edit-customerId">
              Customer
            </label>
            <select
              id="edit-customerId"
              name="customerId"
              defaultValue={equipment.customerId ?? ""}
              className={inputPlain}
            >
              <option value="">None</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelOptional} htmlFor="contactPersonId">
              Contact person
            </label>
            <ContactPicker
              name="contactPersonId"
              options={contacts}
              defaultValue={equipment.contactPersonId}
            />
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-4 border-b border-gray-200 pb-2 text-sm font-semibold text-gray-800">
          Address
        </h3>
        <div>
          <label className={labelOptional} htmlFor="edit-address">
            Address
          </label>
          <input
            id="edit-address"
            name="address"
            type="text"
            defaultValue={equipment.address ?? ""}
            className={inputPlain}
          />
        </div>
      </section>

      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3 border-t border-[#D5D5D5] pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-[#D5D5D5] bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-[#0099FF] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#2AAAFF] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

type Props = {
  equipment: SerializedCommissioningEquipment | null;
  onClose: () => void;
  showProjectInHeader: boolean;
  customers?: CustomerOption[];
  assetTypes?: AssetTypeOption[];
  contacts?: ContactOption[];
  /** All equipment in scope — used to build the parent-asset picker list. */
  allEquipment?: SerializedCommissioningEquipment[];
  onSaved?: () => void;
};

export default function EquipmentRecordDrawer({
  equipment,
  onClose,
  showProjectInHeader,
  customers = [],
  assetTypes = [],
  contacts = [],
  allEquipment = [],
  onSaved,
}: Props) {
  const [tab, setTab] = useState<TabId>("checklist");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!equipment) return;
    setTab("checklist");
    setIsEditing(false);
  }, [equipment]);

  useEffect(() => {
    setIsEditing(false);
  }, [tab]);

  useEffect(() => {
    if (!equipment) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [equipment, onClose]);

  if (!equipment) return null;

  // Eligible parent assets: same project, not self
  const parentAssetOptions = allEquipment.filter(
    (e) => e.projectId === equipment.projectId && e._id !== equipment._id
  );

  const equipmentSummary = [
    `Asset name: ${equipment.assetName}`,
    `Asset number: ${dash(equipment.assetNumber)}`,
    `Service and part: ${equipment.serviceAndPart}`,
    `GIAI: ${dash(equipment.giai)}`,
    `Customer: ${dash(equipment.customerName)}`,
    `Contact: ${equipment.contact}`,
    showProjectInHeader
      ? `Project: ${dash(equipment.projectNumber)} — ${dash(equipment.projectName)}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  function handleEditClick() {
    setTab("details");
    setIsEditing(true);
  }

  function handleSaved() {
    setIsEditing(false);
    onSaved?.();
  }

  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close panel"
        onClick={onClose}
      />
      <div
        className="relative flex h-full w-full max-w-xl flex-col border-l border-[#D5D5D5] bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="equipment-record-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#D5D5D5] px-5 py-4">
          <div className="min-w-0">
            <h2
              id="equipment-record-title"
              className="truncate text-lg font-semibold text-gray-900"
            >
              {equipment.assetName}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Asset #{dash(equipment.assetNumber)} · {equipment.serviceAndPart}
            </p>
            {showProjectInHeader ? (
              <p className="mt-1 text-xs text-gray-600">
                Project {dash(equipment.projectNumber)} — {dash(equipment.projectName)}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {!isEditing ? (
              <button
                type="button"
                onClick={handleEditClick}
                className="rounded border border-[#D5D5D5] px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                Edit
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="shrink-0 border-b border-[#D5D5D5] px-2">
          <nav
            className="flex flex-wrap gap-x-1 gap-y-0"
            aria-label="Equipment record"
          >
            <button
              type="button"
              onClick={() => setTab("checklist")}
              className={`border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                tab === "checklist"
                  ? "border-orange-500 text-gray-900"
                  : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900"
              }`}
            >
              Equipment checklist
            </button>
            <button
              type="button"
              onClick={() => setTab("ai")}
              className={`border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                tab === "ai"
                  ? "border-orange-500 text-gray-900"
                  : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900"
              }`}
            >
              AI verification
            </button>
            <button
              type="button"
              onClick={() => setTab("guidance")}
              className={`border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                tab === "guidance"
                  ? "border-orange-500 text-gray-900"
                  : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900"
              }`}
            >
              Equipment Guidance
            </button>
            <button
              type="button"
              onClick={() => setTab("details")}
              className={`border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                tab === "details"
                  ? "border-orange-500 text-gray-900"
                  : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900"
              }`}
            >
              Record details
            </button>
          </nav>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {tab === "checklist" ? (
            <EquipmentChecklistPanel
              equipmentId={equipment._id}
              active={tab === "checklist"}
            />
          ) : tab === "ai" ? (
            <AiVerificationPanel equipmentSummary={equipmentSummary} />
          ) : tab === "guidance" ? (
            <EquipmentGuidancePanel
              equipmentId={equipment._id}
              active={tab === "guidance"}
            />
          ) : isEditing ? (
            <EditForm
              equipment={equipment}
              customers={customers}
              assetTypes={assetTypes}
              contacts={contacts}
              parentAssetOptions={parentAssetOptions}
              onSaved={handleSaved}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <ReadOnlyDetails equipment={equipment} />
          )}
        </div>
      </div>
    </div>
  );
}
