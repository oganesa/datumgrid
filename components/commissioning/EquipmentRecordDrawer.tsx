"use client";

import { useEffect, useState } from "react";

import type { SerializedCommissioningEquipment } from "@/lib/commissioning-equipment";

import AiVerificationPanel from "./AiVerificationPanel";
import EquipmentChecklistPanel from "./EquipmentChecklistPanel";
import EquipmentGuidancePanel from "./EquipmentGuidancePanel";
import { formatTableDate } from "./format";

type TabId = "checklist" | "ai" | "guidance" | "details";

function dash(s: string | null | undefined) {
  return s?.trim() ? s : "—";
}

function RecordDetailsTab({
  equipment,
}: {
  equipment: SerializedCommissioningEquipment;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Read-only fields from the equipment record. Edit the record from your main
        commissioning list when editing is available.
      </p>
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Record details
        </h3>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gray-500">GIAI</dt>
            <dd className="font-medium text-gray-900">{dash(equipment.giai)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Parent asset</dt>
            <dd className="font-medium text-gray-900">
              {dash(equipment.parentAsset)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Customer</dt>
            <dd className="font-medium text-gray-900">
              {dash(equipment.customerName)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Contact</dt>
            <dd className="font-medium text-gray-900">{equipment.contact}</dd>
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

type Props = {
  equipment: SerializedCommissioningEquipment | null;
  onClose: () => void;
  showProjectInHeader: boolean;
};

export default function EquipmentRecordDrawer({
  equipment,
  onClose,
  showProjectInHeader,
}: Props) {
  const [tab, setTab] = useState<TabId>("checklist");

  useEffect(() => {
    if (!equipment) return;
    setTab("checklist");
  }, [equipment]);

  useEffect(() => {
    if (!equipment) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [equipment, onClose]);

  if (!equipment) return null;

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
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close"
          >
            ✕
          </button>
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
          ) : (
            <RecordDetailsTab equipment={equipment} />
          )}
        </div>
      </div>
    </div>
  );
}
