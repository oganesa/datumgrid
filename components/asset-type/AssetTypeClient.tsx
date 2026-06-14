"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  createAssetType,
  updateAssetType,
  deleteAssetType,
} from "@/actions/assetTypeActions";
import type { SerializedAssetType } from "@/lib/asset-types";

const inputCls =
  "w-full rounded border border-[#E5EAF2] p-2 text-sm outline-none focus:border-[#4A90E2]";
const labelCls = "mb-1 block border-l-4 border-red-500 pl-2 text-xs font-medium text-gray-700";

function AssetTypeModal({
  isOpen,
  onClose,
  editItem,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  editItem: SerializedAssetType | null;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const result = editItem
      ? await updateAssetType(editItem._id, fd)
      : await createAssetType(fd);
    setSaving(false);
    if (!result.success) {
      setError(result.error);
    } else {
      onSaved();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E5EAF2] px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            {editItem ? "Edit asset type" : "Create asset type"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className={labelCls} htmlFor="typeCode">
              Type code * <span className="text-gray-400 font-normal">(001 – 999)</span>
            </label>
            <input
              id="typeCode"
              name="typeCode"
              type="number"
              min={1}
              max={999}
              required
              defaultValue={editItem ? parseInt(editItem.typeCode, 10) : ""}
              placeholder="e.g. 1 → saved as 001"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="typeName">
              Type name *
            </label>
            <input
              id="typeName"
              name="typeName"
              type="text"
              required
              defaultValue={editItem?.typeName ?? ""}
              className={inputCls}
            />
          </div>
          {error && (
            <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3 border-t border-[#E5EAF2] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[#E5EAF2] px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-[#4A90E2] px-5 py-2 text-sm font-semibold text-white hover:bg-[#7FB3FF] disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AssetTypeClient({
  assetTypes: initial,
}: {
  assetTypes: SerializedAssetType[];
}) {
  const router = useRouter();
  const [assetTypes, setAssetTypes] = useState(initial);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<SerializedAssetType | null>(null);

  function openCreate() {
    setEditItem(null);
    setModalOpen(true);
  }

  function openEdit(item: SerializedAssetType) {
    setEditItem(item);
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this asset type?")) return;
    const result = await deleteAssetType(id);
    if (result.success) {
      setAssetTypes((prev) => prev.filter((t) => t._id !== id));
      router.refresh();
    } else {
      alert(result.error);
    }
  }

  function handleSaved() {
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Asset type catalogue — each type has a unique 3-digit code (001–999) and a name.
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-md bg-[#4A90E2] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#7FB3FF]"
        >
          + Create type
        </button>
      </div>

      {assetTypes.length === 0 ? (
        <p className="rounded-md border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          No asset types yet. Use Create type to add one.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-gray-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="border border-gray-200 bg-gray-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-700 w-36">
                  Type code
                </th>
                <th className="border border-gray-200 bg-gray-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-700">
                  Type name
                </th>
                <th className="border border-gray-200 bg-gray-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-700 w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {assetTypes.map((t) => (
                <tr key={t._id} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-2 text-sm font-mono font-medium text-gray-900">
                    {t.typeCode}
                  </td>
                  <td className="border border-gray-200 px-4 py-2 text-sm text-gray-800">
                    {t.typeName}
                  </td>
                  <td className="border border-gray-200 px-4 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(t)}
                        className="text-xs text-[#4A90E2] hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(t._id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AssetTypeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editItem={editItem}
        onSaved={handleSaved}
      />
    </div>
  );
}
