"use client";

import { useCallback, useEffect, useState } from "react";
import type { DriveItem } from "@/lib/google-drive";
import GoogleDriveFolderPicker, { type SelectedFolder } from "@/components/GoogleDriveFolderPicker";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type LinkedFolder = { _id: string; folderId: string; folderName: string; folderUrl: string };
type BreadcrumbItem = { id: string; name: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const FOLDER_MIME = "application/vnd.google-apps.folder";

function fileIcon(mimeType: string) {
  if (mimeType === FOLDER_MIME) return "📁";
  if (mimeType.includes("pdf")) return "📄";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "📊";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "📊";
  if (mimeType.includes("document") || mimeType.includes("word")) return "📝";
  if (mimeType.includes("image")) return "🖼️";
  if (mimeType.includes("video")) return "🎬";
  if (mimeType.includes("zip") || mimeType.includes("archive")) return "📦";
  return "📄";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatSize(bytes?: string) {
  if (!bytes) return "";
  const n = parseInt(bytes, 10);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// Folder card — in-app file explorer with subfolder navigation
// ---------------------------------------------------------------------------
function FolderCard({
  link,
  projectId,
  onRemove,
}: {
  link: LinkedFolder;
  projectId: string;
  onRemove: () => void;
}) {
  // breadcrumb[0] is always the linked root folder
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([
    { id: link.folderId, name: link.folderName },
  ]);
  const [items, setItems] = useState<DriveItem[] | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [removing, setRemoving] = useState(false);

  const currentFolder = breadcrumb[breadcrumb.length - 1];

  const load = useCallback(async (folderId: string) => {
    setItems(null);
    try {
      const res = await fetch(`/api/google-drive/files?folderId=${folderId}`);
      if (!res.ok) { setItems([]); return; }
      const data = await res.json() as { items: DriveItem[] };
      setItems(data.items);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => { void load(currentFolder.id); }, [currentFolder.id, load]);

  function openSubfolder(item: DriveItem) {
    setBreadcrumb((prev) => [...prev, { id: item.id, name: item.name }]);
  }

  function navigateToCrumb(index: number) {
    setBreadcrumb((prev) => prev.slice(0, index + 1));
  }

  async function remove() {
    setRemoving(true);
    try {
      await fetch(`/api/projects/${projectId}/documents/folders/${link._id}`, { method: "DELETE" });
      onRemove();
    } catch {
      setRemoving(false);
    }
  }

  const subfolders = items?.filter((f) => f.mimeType === FOLDER_MIME) ?? [];
  const files = items?.filter((f) => f.mimeType !== FOLDER_MIME) ?? [];

  return (
    <div className="rounded-2xl border border-[#E5EAF2] bg-white overflow-hidden">
      {/* Card header — always shows root folder name */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E5EAF2] bg-[#F7F9FC]">
        <button type="button" onClick={() => setExpanded((v) => !v)} className="text-[#9CA3AF] hover:text-[#1C2E4A] transition-colors shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 150ms" }}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
        <span className="text-base shrink-0">📁</span>
        <span className="flex-1 text-sm font-semibold text-[#1C2E4A] truncate">{link.folderName}</span>
        {items !== null && (
          <span className="text-[11px] text-[#9CA3AF] shrink-0">{items.length} item{items.length !== 1 ? "s" : ""}</span>
        )}
        {link.folderUrl && (
          <a href={link.folderUrl} target="_blank" rel="noopener noreferrer"
            className="text-[#9CA3AF] hover:text-[#4A90E2] transition-colors shrink-0" title="Open root folder in Google Drive">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        )}
        <button type="button" onClick={() => void remove()} disabled={removing}
          className="text-[#D1D5DB] hover:text-red-400 disabled:opacity-40 transition-colors text-lg leading-none shrink-0" title="Unlink folder">
          ×
        </button>
      </div>

      {expanded && (
        <>
          {/* Breadcrumb — only shown when inside a subfolder */}
          {breadcrumb.length > 1 && (
            <div className="flex items-center gap-1 px-4 py-2 border-b border-[#E5EAF2] bg-[#F7F9FC]/60 flex-wrap">
              {breadcrumb.map((crumb, i) => (
                <span key={crumb.id} className="flex items-center gap-1">
                  {i > 0 && <span className="text-[#D1D5DB] text-xs">/</span>}
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
          )}

          {/* Content */}
          <div>
            {items === null ? (
              <div className="flex items-center gap-2 px-4 py-4 text-xs text-[#9CA3AF]">
                <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                Loading…
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-4 text-xs text-[#9CA3AF] text-center">This folder is empty</p>
            ) : (
              <>
                {/* Subfolders — click to navigate in-app */}
                {subfolders.map((f) => (
                  <div
                    key={f.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openSubfolder(f)}
                    onKeyDown={(e) => e.key === "Enter" && openSubfolder(f)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F7F9FC] transition-colors border-b border-[#E5EAF2]/60 cursor-pointer group"
                  >
                    <span className="shrink-0 text-base">📁</span>
                    <span className="flex-1 text-sm text-[#374151] truncate group-hover:text-[#4A90E2] transition-colors">{f.name}</span>
                    <span className="text-[11px] text-[#9CA3AF]">{formatDate(f.modifiedTime)}</span>
                    <svg className="text-[#D1D5DB] shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                ))}
                {/* Files — click to open in Google Drive */}
                {files.map((f) => (
                  <a
                    key={f.id}
                    href={f.webViewLink ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F7F9FC] transition-colors border-b border-[#E5EAF2]/60 last:border-0 group"
                  >
                    <span className="shrink-0 text-base">{fileIcon(f.mimeType)}</span>
                    <span className="flex-1 text-sm text-[#374151] truncate group-hover:text-[#4A90E2] transition-colors">{f.name}</span>
                    <span className="text-[11px] text-[#9CA3AF]">{formatSize(f.size)}</span>
                    <span className="text-[11px] text-[#9CA3AF] ml-2 shrink-0">{formatDate(f.modifiedTime)}</span>
                    {/* Open in Drive icon */}
                    <svg className="opacity-0 group-hover:opacity-100 transition-opacity text-[#4A90E2] shrink-0 ml-1" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main DocumentsTab
// ---------------------------------------------------------------------------
export default function DocumentsTab({ projectId }: { projectId: string }) {
  const [folders, setFolders] = useState<LinkedFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [driveConnected, setDriveConnected] = useState<boolean | null>(null);

  useEffect(() => {
    async function init() {
      const [statusRes, foldersRes] = await Promise.all([
        fetch("/api/google-drive/status"),
        fetch(`/api/projects/${projectId}/documents/folders`),
      ]);
      const status = await statusRes.json() as { connected: boolean };
      setDriveConnected(status.connected);
      if (foldersRes.ok) {
        const data = await foldersRes.json() as { folders: LinkedFolder[] };
        setFolders(data.folders);
      }
      setLoading(false);
    }
    void init();
  }, [projectId]);

  async function handleSelect(picks: SelectedFolder[]) {
    setShowPicker(false);
    const results = await Promise.all(
      picks.map(({ id, name, url }) =>
        fetch(`/api/projects/${projectId}/documents/folders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folderId: id, folderName: name, folderUrl: url }),
        }).then((r) => (r.ok ? r.json() as Promise<{ folder: LinkedFolder }> : null))
      )
    );
    const added = results.filter(Boolean).map((r) => (r as { folder: LinkedFolder }).folder);
    if (added.length) setFolders((prev) => [...prev, ...added]);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-[#9CA3AF]">
        <svg className="animate-spin mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
        Loading documents…
      </div>
    );
  }

  if (!driveConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="text-5xl">☁️</div>
        <h3 className="text-base font-semibold text-[#1C2E4A]">Google Drive not connected</h3>
        <p className="text-sm text-[#6B7280] max-w-xs">
          Connect your Google Drive account in Settings to link folders to this project.
        </p>
        <a href="/settings?section=documents"
          className="mt-2 px-4 py-2 bg-[#1C2E4A] text-white text-sm font-medium rounded-lg hover:opacity-80 transition-opacity">
          Go to Settings → Documents
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#1C2E4A]">Project Documents</h2>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            {folders.length === 0 ? "Link Google Drive folders to see files here" : `${folders.length} folder${folders.length !== 1 ? "s" : ""} linked`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1C2E4A] text-white text-sm font-medium rounded-xl hover:opacity-80 transition-opacity"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            <line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" />
          </svg>
          Link Drive Folder
        </button>
      </div>

      {/* Empty state */}
      {folders.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E5EAF2] py-20 gap-3 text-center">
          <div className="text-4xl">📁</div>
          <h3 className="text-sm font-semibold text-[#1C2E4A]">No folders linked yet</h3>
          <p className="text-xs text-[#9CA3AF] max-w-xs">
            Click <strong>Link Drive Folder</strong> to browse your Google Drive and attach folders to this project.
          </p>
        </div>
      )}

      {/* Linked folders */}
      {folders.map((link) => (
        <FolderCard
          key={link._id}
          link={link}
          projectId={projectId}
          onRemove={() => setFolders((prev) => prev.filter((f) => f._id !== link._id))}
        />
      ))}

      {/* Folder picker modal */}
      {showPicker && (
        <GoogleDriveFolderPicker
          onSelect={(picks) => void handleSelect(picks)}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
