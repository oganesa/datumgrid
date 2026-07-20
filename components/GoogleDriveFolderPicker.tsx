"use client";

import { useEffect, useState } from "react";
import type { DriveItem } from "@/lib/google-drive";

type DriveLocation = "root" | "sharedWithMe";
type BreadcrumbItem = { id: string; name: string };
export type SelectedFolder = { id: string; name: string; url: string };

type Props = {
  onSelect: (folders: SelectedFolder[]) => void;
  onClose: () => void;
  /** Defaults to true (checkbox multi-select, as used by Documents folder linking). */
  multiSelect?: boolean;
  /** Overrides the confirm button label; falls back to "Link N folder(s)". */
  confirmLabel?: string;
};

export default function GoogleDriveFolderPicker({
  onSelect,
  onClose,
  multiSelect = true,
  confirmLabel,
}: Props) {
  const [location, setLocation] = useState<DriveLocation>("root");
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
  const [items, setItems] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // key = folder id, value = {id, name, url}
  const [selected, setSelected] = useState<Map<string, SelectedFolder>>(new Map());

  const browseFolderId =
    breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].id
    : location === "sharedWithMe" ? "sharedWithMe"
    : "root";

  useEffect(() => {
    async function load(folderId: string) {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/google-drive/browse?folderId=${folderId}&foldersOnly=1`);
        if (!res.ok) {
          const d = await res.json() as { error?: string };
          throw new Error(d.error ?? "Failed to load folders");
        }
        const data = await res.json() as { items: DriveItem[] };
        setItems(data.items);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    void load(browseFolderId);
  }, [browseFolderId]);

  function switchLocation(loc: DriveLocation) {
    setLocation(loc);
    setBreadcrumb([]);
  }

  function navigateTo(item: DriveItem) {
    setBreadcrumb((prev) => [...prev, { id: item.id, name: item.name }]);
  }

  function navigateToCrumb(index: number) {
    setBreadcrumb((prev) => prev.slice(0, index + 1));
  }

  function toggleFolder(item: DriveItem) {
    setSelected((prev) => {
      if (!multiSelect) {
        if (prev.has(item.id)) return new Map();
        return new Map([[item.id, { id: item.id, name: item.name, url: item.webViewLink ?? "" }]]);
      }
      const next = new Map(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.set(item.id, { id: item.id, name: item.name, url: item.webViewLink ?? "" });
      }
      return next;
    });
  }

  const selectedCount = selected.size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: 560, maxHeight: "75vh", border: "1px solid #E5EAF2" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5EAF2]">
          <div>
            <h2 className="text-sm font-semibold text-[#1C2E4A]">
              {multiSelect ? "Select Google Drive Folders" : "Select a Google Drive Folder"}
            </h2>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              {multiSelect
                ? "Check folders to link, browse into them to find subfolders"
                : "Choose a folder, browse into it to find subfolders"}
            </p>
          </div>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#1C2E4A] text-xl leading-none">×</button>
        </div>

        {/* Location tabs */}
        <div className="flex border-b border-[#E5EAF2]">
          {(["root", "sharedWithMe"] as DriveLocation[]).map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => switchLocation(loc)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                location === loc
                  ? "text-[#1C2E4A] border-b-2 border-[#4A90E2] bg-[#F7F9FC]"
                  : "text-[#9CA3AF] hover:text-[#1C2E4A]"
              }`}
            >
              {loc === "root" ? "My Drive" : "Shared with me"}
            </button>
          ))}
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 px-5 py-2 border-b border-[#E5EAF2] bg-[#F7F9FC] flex-wrap min-h-[36px]">
          <button
            type="button"
            onClick={() => setBreadcrumb([])}
            className={`text-xs rounded px-1 py-0.5 transition-colors ${
              breadcrumb.length === 0 ? "font-semibold text-[#1C2E4A]" : "text-[#4A90E2] hover:bg-[#EBF3FF]"
            }`}
          >
            {location === "sharedWithMe" ? "Shared with me" : "My Drive"}
          </button>
          {breadcrumb.map((crumb, i) => (
            <span key={crumb.id} className="flex items-center gap-1">
              <span className="text-[#D1D5DB] text-xs">/</span>
              <button
                type="button"
                onClick={() => navigateToCrumb(i)}
                className={`text-xs rounded px-1 py-0.5 transition-colors ${
                  i === breadcrumb.length - 1
                    ? "font-semibold text-[#1C2E4A]"
                    : "text-[#4A90E2] hover:bg-[#EBF3FF]"
                }`}
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </div>

        {/* Folder list */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-[#9CA3AF]">
              <svg className="animate-spin mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              Loading folders…
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 px-6 text-center">
              {error.includes("insufficient") || error.includes("403") ? (
                <>
                  <div className="text-3xl">🔑</div>
                  <p className="text-sm font-semibold text-[#1C2E4A]">Google Drive access not granted</p>
                  <p className="text-xs text-[#6B7280]">Please disconnect and reconnect Google Drive in Settings.</p>
                  <a href="/settings?section=documents" className="mt-1 px-4 py-2 bg-[#1C2E4A] text-white text-xs font-medium rounded-lg hover:opacity-80 transition-opacity">
                    Go to Settings → Reconnect
                  </a>
                </>
              ) : (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-sm text-[#9CA3AF] py-12">No folders found here</p>
          ) : (
            items.map((item) => {
              const isChecked = selected.has(item.id);
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group ${
                    isChecked ? "bg-[#EBF3FF]" : "hover:bg-[#F7F9FC]"
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleFolder(item)}
                    className="shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                    style={{
                      borderColor: isChecked ? "#4A90E2" : "#D1D5DB",
                      backgroundColor: isChecked ? "#4A90E2" : "white",
                    }}
                    aria-label={isChecked ? "Deselect" : "Select"}
                  >
                    {isChecked && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>

                  {/* Folder name — click to navigate */}
                  <span className="text-base shrink-0">📁</span>
                  <span
                    className="flex-1 text-sm text-[#1F2937] truncate cursor-pointer group-hover:text-[#4A90E2] transition-colors"
                    onClick={() => navigateTo(item)}
                  >
                    {item.name}
                  </span>

                  {/* Drill-in arrow */}
                  <button
                    type="button"
                    onClick={() => navigateTo(item)}
                    className="shrink-0 text-[#D1D5DB] hover:text-[#4A90E2] transition-colors"
                    title="Browse into folder"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-[#E5EAF2] bg-[#F7F9FC]">
          <span className="text-xs text-[#9CA3AF]">
            {selectedCount === 0 ? "No folder selected" : multiSelect ? `${selectedCount} folder${selectedCount !== 1 ? "s" : ""} selected` : "1 folder selected"}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#6B7280] hover:text-[#1C2E4A] border border-[#E5EAF2] rounded-lg bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={() => onSelect(Array.from(selected.values()))}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#1C2E4A] rounded-lg hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {confirmLabel ?? (selectedCount > 0 ? `Link ${selectedCount} folder${selectedCount !== 1 ? "s" : ""}` : "Link folders")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
