"use client";

import { useCallback, useEffect, useState } from "react";

import type { GuidanceCategory } from "@/lib/equipment-guidance-types";
import type { SerializedGuidanceFile } from "@/lib/equipment-guidance";

const CATEGORY_ORDER: GuidanceCategory[] = [
  "datasheet",
  "user_manual",
  "installation_manual",
  "commissioning_manual",
];

const CATEGORY_LABELS: Record<GuidanceCategory, string> = {
  datasheet: "Data sheets",
  user_manual: "User manuals",
  installation_manual: "Installation manuals",
  commissioning_manual: "Commissioning manuals",
};

const ACCEPT =
  "application/pdf,image/jpeg,image/png,image/webp,image/gif,.pdf,.jpg,.jpeg,.png,.webp,.gif";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

type Props = {
  equipmentId: string;
  active: boolean;
};

export default function EquipmentGuidancePanel({ equipmentId, active }: Props) {
  const [files, setFiles] = useState<SerializedGuidanceFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingCategory, setUploadingCategory] = useState<GuidanceCategory | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/commissioning/guidance?equipmentId=${encodeURIComponent(equipmentId)}`
      );
      const data = (await res.json()) as {
        files?: SerializedGuidanceFile[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? `Failed to load (${res.status})`);
        setFiles([]);
        return;
      }
      setFiles(data.files ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Network error.");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [equipmentId]);

  useEffect(() => {
    if (!active || !equipmentId) return;
    void load();
  }, [active, equipmentId, load]);

  async function onUpload(category: GuidanceCategory, fileList: FileList | null) {
    if (!fileList?.length) return;
    setUploadingCategory(category);
    setError(null);
    try {
      const form = new FormData();
      form.set("equipmentId", equipmentId);
      form.set("category", category);
      for (let i = 0; i < fileList.length; i += 1) {
        form.append("files", fileList[i]!);
      }
      const res = await fetch("/api/commissioning/guidance/upload", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? `Upload failed (${res.status})`);
        return;
      }
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploadingCategory(null);
    }
  }

  async function onDelete(fileId: string) {
    if (!confirm("Delete this file?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/commissioning/guidance/file/${fileId}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? `Delete failed (${res.status})`);
        return;
      }
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  const byCategory = (cat: GuidanceCategory) =>
    files.filter((f) => f.category === cat);

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        Upload PDFs and images for this equipment. Files are stored on the server and
        listed by category. Maximum <strong>25 MB</strong> per file.
      </p>

      {error ? (
        <div
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {loading && files.length === 0 ? (
        <p className="text-sm text-gray-500">Loading files…</p>
      ) : null}

      {CATEGORY_ORDER.map((category) => {
        const list = byCategory(category);
        const busy = uploadingCategory === category;
        return (
          <section
            key={category}
            className="rounded-lg border border-[#D5D5D5] bg-white p-4 shadow-sm"
          >
            <h4 className="text-sm font-semibold text-gray-900">
              {CATEGORY_LABELS[category]}
            </h4>
            <p className="mt-0.5 text-xs text-gray-500">
              PDF, JPEG, PNG, WebP, or GIF — multiple files allowed.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center rounded-md border border-[#D5D5D5] bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-100">
                <input
                  type="file"
                  className="sr-only"
                  accept={ACCEPT}
                  multiple
                  disabled={busy}
                  onChange={(e) => {
                    const fl = e.target.files;
                    e.target.value = "";
                    void onUpload(category, fl);
                  }}
                />
                {busy ? "Uploading…" : "Add files"}
              </label>
            </div>
            {list.length > 0 ? (
              <ul className="mt-3 divide-y divide-gray-100 border-t border-gray-100 pt-2 text-sm">
                {list.map((f) => (
                  <li
                    key={f._id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2"
                  >
                    <a
                      href={`/api/commissioning/guidance/file/${f._id}`}
                      className="min-w-0 flex-1 truncate font-medium text-[#0099FF] hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {f.originalName}
                    </a>
                    <span className="shrink-0 text-xs text-gray-500">
                      {formatBytes(f.sizeBytes)}
                    </span>
                    <button
                      type="button"
                      onClick={() => void onDelete(f._id)}
                      className="shrink-0 rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-gray-400">No files yet.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
