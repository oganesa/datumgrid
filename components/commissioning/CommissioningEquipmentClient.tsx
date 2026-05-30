"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { SerializedCommissioningEquipment } from "@/lib/commissioning-equipment";

import CommissioningEquipmentTable from "./CommissioningEquipmentTable";
import EquipmentRecordDrawer from "./EquipmentRecordDrawer";
import NewEquipmentModal from "./NewEquipmentModal";

type ProjectOption = { _id: string; name: string; number: string };
type CustomerOption = { _id: string; name: string };

type Props = {
  equipment: SerializedCommissioningEquipment[];
  showProjectColumns: boolean;
  /** When set, new equipment is tied to this project (no project dropdown). */
  contextProjectId?: string;
  /** For global commissioning: projects to populate the create modal. */
  projectsForSelect?: ProjectOption[];
  /** Customers for the create-equipment modal (links to Customer records). */
  customersForSelect?: CustomerOption[];
};

export default function CommissioningEquipmentClient({
  equipment,
  showProjectColumns,
  contextProjectId,
  projectsForSelect = [],
  customersForSelect = [],
}: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [openRecord, setOpenRecord] =
    useState<SerializedCommissioningEquipment | null>(null);

  const canCreate =
    Boolean(contextProjectId) || projectsForSelect.length > 0;

  function onSuccess() {
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          Equipment scheduled for commissioning. Double-click a row to open the
          record (checklist, AI verification, guidance files, and record details).
          Required fields for new rows: asset name, service and part, and contact.
        </p>
        <button
          type="button"
          disabled={!canCreate}
          title={
            !canCreate
              ? "Create a project under Projects before adding equipment."
              : undefined
          }
          onClick={() => setModalOpen(true)}
          className="shrink-0 rounded-md bg-[#0099FF] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#2AAAFF] disabled:cursor-not-allowed disabled:opacity-50"
        >
          + Create equipment
        </button>
      </div>

      <CommissioningEquipmentTable
        rows={equipment}
        showProjectColumns={showProjectColumns}
        onRowOpen={(row) => setOpenRecord(row)}
      />

      <EquipmentRecordDrawer
        equipment={openRecord}
        onClose={() => setOpenRecord(null)}
        showProjectInHeader={showProjectColumns}
      />

      <NewEquipmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={onSuccess}
        fixedProjectId={contextProjectId}
        projects={contextProjectId ? undefined : projectsForSelect}
        customers={customersForSelect}
      />
    </div>
  );
}
