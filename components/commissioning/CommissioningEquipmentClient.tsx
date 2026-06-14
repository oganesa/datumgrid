"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { SerializedCommissioningEquipment } from "@/lib/commissioning-equipment";
import {
  ALL_ASSETS_VIEW_ID,
  DEFAULT_VIEW_STORAGE_KEY,
  type ColumnKey,
  type FilterField,
  type SerializedView,
} from "@/lib/commissioning-view-types";

import CommissioningEquipmentTable from "./CommissioningEquipmentTable";
import CreateViewModal from "./CreateViewModal";
import EquipmentRecordDrawer from "./EquipmentRecordDrawer";
import NewEquipmentModal from "./NewEquipmentModal";
import ViewSelector from "./ViewSelector";

import type { ContactOption } from "./ContactPicker";

type ProjectOption = { _id: string; name: string; number: string };
type CustomerOption = { _id: string; name: string };
type AssetTypeOption = { _id: string; typeCode: string; typeName: string };

type Props = {
  equipment: SerializedCommissioningEquipment[];
  showProjectColumns: boolean;
  contextProjectId?: string;
  projectsForSelect?: ProjectOption[];
  customersForSelect?: CustomerOption[];
  assetTypesForSelect?: AssetTypeOption[];
  contactsForSelect?: ContactOption[];
  initialViews?: SerializedView[];
};

function getFieldValue(
  e: SerializedCommissioningEquipment,
  field: FilterField
): string {
  switch (field) {
    case "assetName":      return e.assetName ?? "";
    case "assetNumber":    return e.assetNumber ?? "";
    case "serviceAndPart": return e.serviceAndPart ?? "";
    case "contact":        return e.contact ?? "";
    case "customerName":   return e.customerName ?? "";
    case "parentAssetName":return e.parentAssetName ?? "";
    case "projectNumber":  return e.projectNumber ?? "";
    case "projectName":    return e.projectName ?? "";
    default:               return "";
  }
}

function applyView(
  equipment: SerializedCommissioningEquipment[],
  view: SerializedView
): SerializedCommissioningEquipment[] {
  if (!view.filters.length) return equipment;
  return equipment.filter((eq) =>
    view.filters.every((f) => {
      const val = getFieldValue(eq, f.field).toLowerCase();
      const fv = f.value.toLowerCase();
      switch (f.operator) {
        case "is":         return val === fv;
        case "isNot":      return val !== fv;
        case "contains":   return val.includes(fv);
        case "startsWith": return val.startsWith(fv);
        default:           return true;
      }
    })
  );
}

export default function CommissioningEquipmentClient({
  equipment,
  showProjectColumns,
  contextProjectId,
  projectsForSelect = [],
  customersForSelect = [],
  assetTypesForSelect = [],
  contactsForSelect = [],
  initialViews,
}: Props) {
  const router = useRouter();

  const [views, setViews] = useState<SerializedView[]>(initialViews ?? []);
  const [activeViewId, setActiveViewId] = useState(ALL_ASSETS_VIEW_ID);
  const [defaultViewId, setDefaultViewId] = useState(ALL_ASSETS_VIEW_ID);

  const [modalOpen, setModalOpen] = useState(false);
  const [openRecord, setOpenRecord] = useState<SerializedCommissioningEquipment | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingView, setEditingView] = useState<SerializedView | null>(null);

  // Load persisted default view and start with it
  useEffect(() => {
    const saved = localStorage.getItem(DEFAULT_VIEW_STORAGE_KEY);
    if (saved) {
      setDefaultViewId(saved);
      // Only switch to it if the view still exists
      const exists =
        saved === ALL_ASSETS_VIEW_ID || views.some((v) => v._id === saved);
      if (exists) setActiveViewId(saved);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canCreate = Boolean(contextProjectId) || projectsForSelect.length > 0;

  const activeView =
    activeViewId === ALL_ASSETS_VIEW_ID
      ? null
      : views.find((v) => v._id === activeViewId) ?? null;

  const filteredEquipment = activeView
    ? applyView(equipment, activeView)
    : equipment;

  const visibleColumns: ColumnKey[] | null =
    activeView?.columns && activeView.columns.length > 0
      ? activeView.columns
      : null;

  function handleSetDefault(id: string) {
    setDefaultViewId(id);
    localStorage.setItem(DEFAULT_VIEW_STORAGE_KEY, id);
  }

  function handleViewDeleted(id: string) {
    setViews((prev) => prev.filter((v) => v._id !== id));
    if (activeViewId === id) setActiveViewId(ALL_ASSETS_VIEW_ID);
    if (defaultViewId === id) handleSetDefault(ALL_ASSETS_VIEW_ID);
  }

  function handleViewSaved(savedView: SerializedView) {
    setViews((prev) => {
      const idx = prev.findIndex((v) => v._id === savedView._id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedView;
        return next;
      }
      return [...prev, savedView];
    });
    setActiveViewId(savedView._id);
    setEditingView(null);
  }

  function openEditView(view: SerializedView) {
    setEditingView(view);
    setViewModalOpen(true);
  }

  function onEquipmentSuccess() {
    router.refresh();
  }

  function onSaved() {
    setOpenRecord(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ViewSelector
            views={views}
            activeViewId={activeViewId}
            defaultViewId={defaultViewId}
            onViewChange={setActiveViewId}
            onSetDefault={handleSetDefault}
            onCreateView={() => {
              setEditingView(null);
              setViewModalOpen(true);
            }}
            onEditView={openEditView}
            onViewDeleted={handleViewDeleted}
          />
          {activeView && (
            <span className="text-xs text-gray-500">
              {filteredEquipment.length} of {equipment.length} items
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <p className="hidden text-sm text-gray-600 lg:block">
            Double-click a row to open the record.
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
            className="shrink-0 rounded-md bg-[#4A90E2] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#7FB3FF] disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Create equipment
          </button>
        </div>
      </div>

      <CommissioningEquipmentTable
        rows={filteredEquipment}
        showProjectColumns={showProjectColumns}
        visibleColumns={visibleColumns}
        onRowOpen={(row) => setOpenRecord(row)}
      />

      <EquipmentRecordDrawer
        equipment={openRecord}
        onClose={() => setOpenRecord(null)}
        showProjectInHeader={showProjectColumns}
        customers={customersForSelect}
        assetTypes={assetTypesForSelect}
        contacts={contactsForSelect}
        allEquipment={equipment}
        onSaved={onSaved}
      />

      <NewEquipmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={onEquipmentSuccess}
        fixedProjectId={contextProjectId}
        projects={contextProjectId ? undefined : projectsForSelect}
        customers={customersForSelect}
        assetTypes={assetTypesForSelect}
        contacts={contactsForSelect}
        allEquipment={equipment}
      />

      <CreateViewModal
        key={editingView?._id ?? "new"}
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setEditingView(null);
        }}
        onSaved={handleViewSaved}
        editView={editingView}
        showProjectColumns={showProjectColumns}
      />
    </div>
  );
}
