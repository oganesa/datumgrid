"use client";

import { useState } from "react";

import {
  createCommissioningView,
  updateCommissioningView,
} from "@/actions/commissioningViewActions";
import {
  CONFIGURABLE_COLUMNS,
  FILTER_FIELDS,
  FILTER_OPERATORS,
  type ColumnKey,
  type FilterField,
  type FilterOperator,
  type SerializedView,
} from "@/lib/commissioning-view-types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (view: SerializedView) => void;
  /** When set, modal is in edit mode */
  editView?: SerializedView | null;
  /** Whether project number/name columns should appear in the column picker */
  showProjectColumns?: boolean;
};

function labelFor(key: ColumnKey): string {
  return CONFIGURABLE_COLUMNS.find((c) => c.key === key)?.label ?? key;
}

export default function CreateViewModal({
  isOpen,
  onClose,
  onSaved,
  editView,
  showProjectColumns = true,
}: Props) {
  const isEdit = !!editView;

  const ALL_COLUMN_KEYS = CONFIGURABLE_COLUMNS
    .filter((c) => showProjectColumns || !c.projectOnly)
    .map((c) => c.key as ColumnKey);

  const initFilter = editView?.filters[0];
  const initColumns: ColumnKey[] =
    editView?.columns ?? ALL_COLUMN_KEYS;

  const [name, setName] = useState(editView?.name ?? "");
  const [description, setDescription] = useState(editView?.description ?? "");
  const [filterField, setFilterField] = useState<FilterField>(
    (initFilter?.field as FilterField) ?? "assetName"
  );
  const [filterOperator, setFilterOperator] = useState<FilterOperator>(
    (initFilter?.operator as FilterOperator) ?? "contains"
  );
  const [filterValue, setFilterValue] = useState(initFilter?.value ?? "");
  const [customizeColumns, setCustomizeColumns] = useState(
    isEdit ? editView.columns !== null : false
  );
  const [selectedColumns, setSelectedColumns] = useState<ColumnKey[]>(initColumns);
  const [availSearch, setAvailSearch] = useState("");
  const [selSearch, setSelSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const availableColumns = ALL_COLUMN_KEYS.filter(
    (k) =>
      !selectedColumns.includes(k) &&
      (!availSearch ||
        labelFor(k).toLowerCase().includes(availSearch.toLowerCase()))
  );

  const visibleSelected = selectedColumns.filter(
    (k) =>
      !selSearch || labelFor(k).toLowerCase().includes(selSearch.toLowerCase())
  );

  function addColumn(key: ColumnKey) {
    setSelectedColumns((prev) => [...prev, key]);
  }

  function removeColumn(key: ColumnKey) {
    setSelectedColumns((prev) => prev.filter((k) => k !== key));
  }

  function moveAllToSelected() {
    const toAdd = ALL_COLUMN_KEYS.filter((k) => !selectedColumns.includes(k));
    setSelectedColumns((prev) => [...prev, ...toAdd]);
  }

  function moveAllToAvailable() {
    setSelectedColumns([]);
  }

  function moveColumn(key: ColumnKey, direction: "up" | "down") {
    setSelectedColumns((prev) => {
      const idx = prev.indexOf(key);
      if (direction === "up" && idx <= 0) return prev;
      if (direction === "down" && idx >= prev.length - 1) return prev;
      const next = [...prev];
      const swap = direction === "up" ? idx - 1 : idx + 1;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("View name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("description", description.trim());
    if (filterValue.trim()) {
      formData.set("filterField", filterField);
      formData.set("filterOperator", filterOperator);
      formData.set("filterValue", filterValue.trim());
    }
    const cols = customizeColumns ? selectedColumns : [];
    formData.set("columns", JSON.stringify(cols));

    let result:
      | { success: true; id?: string }
      | { success: false; error: string };

    if (isEdit && editView) {
      result = await updateCommissioningView(editView._id, formData);
    } else {
      result = await createCommissioningView(formData);
    }

    setSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    const savedView: SerializedView = {
      _id: isEdit ? editView!._id : (result as { success: true; id: string }).id,
      name: name.trim(),
      description: description.trim(),
      filters:
        filterValue.trim()
          ? [{ field: filterField, operator: filterOperator, value: filterValue.trim() }]
          : [],
      columns: customizeColumns && selectedColumns.length > 0 ? selectedColumns : null,
    };

    onSaved(savedView);
    onClose();
  }

  const inputCls =
    "w-full rounded border border-[#D5D5D5] bg-[#1a1a2e] px-3 py-1.5 text-sm text-white outline-none focus:border-[#0099FF]";
  const labelCls = "mb-1 block text-xs font-medium text-gray-300";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-[#12122a] text-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-base font-semibold">
            {isEdit ? "Edit View" : "Create Custom View"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto"
        >
          <div className="space-y-5 px-5 py-4">
            {/* Filter row */}
            <div className="flex gap-2">
              <select
                value={filterField}
                onChange={(e) => setFilterField(e.target.value as FilterField)}
                className="rounded border border-white/20 bg-[#1a1a2e] px-2 py-1.5 text-sm text-white outline-none focus:border-[#0099FF]"
              >
                {FILTER_FIELDS.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>
              <select
                value={filterOperator}
                onChange={(e) =>
                  setFilterOperator(e.target.value as FilterOperator)
                }
                className="rounded border border-white/20 bg-[#1a1a2e] px-2 py-1.5 text-sm text-white outline-none focus:border-[#0099FF]"
              >
                {FILTER_OPERATORS.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                placeholder="Value (leave empty for no filter)"
                className="min-w-0 flex-1 rounded border border-white/20 bg-[#1a1a2e] px-3 py-1.5 text-sm text-white placeholder-gray-500 outline-none focus:border-[#0099FF]"
              />
            </div>

            {/* Name */}
            <div>
              <label className={labelCls}>
                Custom View Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputCls}
              />
            </div>

            {/* Description */}
            <div>
              <label className={labelCls}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </div>

            {/* Column customization */}
            <div>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={customizeColumns}
                  onChange={(e) => setCustomizeColumns(e.target.checked)}
                  className="h-4 w-4 accent-[#0099FF]"
                />
                Customize Columns to be Displayed
              </label>
            </div>

            {customizeColumns && (
              <div className="grid grid-cols-2 gap-4">
                {/* Available */}
                <div className="flex flex-col rounded border border-white/10 bg-[#1a1a2e]">
                  <div className="border-b border-white/10 px-3 py-2">
                    <p className="mb-1.5 text-xs font-semibold text-gray-300">
                      Available
                    </p>
                    <input
                      type="text"
                      value={availSearch}
                      onChange={(e) => setAvailSearch(e.target.value)}
                      placeholder="Search"
                      className="w-full rounded border border-white/20 bg-[#12122a] px-2 py-1 text-xs text-white outline-none focus:border-[#0099FF]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={moveAllToSelected}
                    className="px-3 py-1.5 text-left text-xs font-medium text-[#0099FF] hover:underline"
                  >
                    MOVE ALL ▶
                  </button>
                  <ul className="min-h-[8rem] flex-1 overflow-y-auto">
                    {availableColumns.map((key) => (
                      <li key={key}>
                        <button
                          type="button"
                          onClick={() => addColumn(key)}
                          className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-white/10"
                        >
                          {labelFor(key)}
                        </button>
                      </li>
                    ))}
                    {availableColumns.length === 0 && (
                      <p className="px-3 py-2 text-xs text-gray-500">
                        All columns selected
                      </p>
                    )}
                  </ul>
                </div>

                {/* Selected */}
                <div className="flex flex-col rounded border border-white/10 bg-[#1a1a2e]">
                  <div className="border-b border-white/10 px-3 py-2">
                    <p className="mb-1.5 text-xs font-semibold text-gray-300">
                      Selected
                    </p>
                    <input
                      type="text"
                      value={selSearch}
                      onChange={(e) => setSelSearch(e.target.value)}
                      placeholder="Search"
                      className="w-full rounded border border-white/20 bg-[#12122a] px-2 py-1 text-xs text-white outline-none focus:border-[#0099FF]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={moveAllToAvailable}
                    className="px-3 py-1.5 text-left text-xs font-medium text-[#0099FF] hover:underline"
                  >
                    ◀ MOVE ALL
                  </button>
                  <ul className="min-h-[8rem] flex-1 overflow-y-auto">
                    {/* Asset Name is always required, always first */}
                    <li>
                      <div className="flex items-center gap-1 px-3 py-1.5">
                        <span className="w-9 shrink-0" />
                        <span className="flex-1 text-sm text-gray-200">
                          Asset Name{" "}
                          <span className="text-xs text-red-400">*</span>
                        </span>
                      </div>
                    </li>
                    {visibleSelected.map((key) => {
                      const fullIdx = selectedColumns.indexOf(key);
                      const isFirst = fullIdx === 0;
                      const isLast = fullIdx === selectedColumns.length - 1;
                      const searching = selSearch.length > 0;
                      return (
                        <li key={key} className="flex items-center gap-1 px-3 py-1.5 hover:bg-white/10">
                          <div className="flex shrink-0 flex-col">
                            <button
                              type="button"
                              onClick={() => moveColumn(key, "up")}
                              disabled={isFirst || searching}
                              title={searching ? "Clear search to reorder" : "Move up"}
                              className="flex h-4 w-4 items-center justify-center text-gray-400 hover:text-white disabled:opacity-25"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => moveColumn(key, "down")}
                              disabled={isLast || searching}
                              title={searching ? "Clear search to reorder" : "Move down"}
                              className="flex h-4 w-4 items-center justify-center text-gray-400 hover:text-white disabled:opacity-25"
                            >
                              ▼
                            </button>
                          </div>
                          <span className="flex-1 text-sm text-gray-200">
                            {labelFor(key)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeColumn(key)}
                            title="Remove"
                            className="shrink-0 text-xs text-gray-500 hover:text-white"
                          >
                            ✕
                          </button>
                        </li>
                      );
                    })}
                    {visibleSelected.length === 0 && (
                      <p className="px-3 py-2 text-xs text-gray-500">
                        No columns selected
                      </p>
                    )}
                  </ul>
                </div>
              </div>
            )}

            {error && (
              <p className="rounded border border-red-600/40 bg-red-900/30 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex shrink-0 justify-start gap-3 border-t border-white/10 px-5 py-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-[#0099FF] px-5 py-2 text-sm font-semibold text-white hover:bg-[#2AAAFF] disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
