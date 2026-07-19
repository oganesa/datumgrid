"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PdfThumbnail from "@/components/PdfThumbnail";
import PdfViewer from "@/components/PdfViewer";

const DISCIPLINES = [
  "Architectural",
  "Structural",
  "Mechanical",
  "Electrical",
  "Plumbing",
  "Civil",
  "Fire Protection",
  "Technology",
  "Landscape",
  "General",
] as const;

type Sheet = {
  _id: string;
  sheetName: string;
  pageNumber: number;
  storedFileName: string;
  discipline: string;
  order: number;
  originalFileName: string;
  createdAt: string;
};

type Parameter = {
  _id: string;
  name: string;
  type: "count" | "linear" | "sqf";
  order: number;
};

const TYPE_LABELS: Record<Parameter["type"], string> = {
  count: "Count",
  linear: "Linear",
  sqf: "SQF",
};

const TYPE_COLORS: Record<Parameter["type"], string> = {
  count: "bg-blue-100 text-blue-700",
  linear: "bg-green-100 text-green-700",
  sqf: "bg-orange-100 text-orange-700",
};

const DISCIPLINE_COLORS: Record<string, string> = {
  Architectural: "bg-purple-100 text-purple-700",
  Structural: "bg-red-100 text-red-700",
  Mechanical: "bg-yellow-100 text-yellow-700",
  Electrical: "bg-amber-100 text-amber-700",
  Plumbing: "bg-cyan-100 text-cyan-700",
  Civil: "bg-teal-100 text-teal-700",
  "Fire Protection": "bg-red-100 text-red-600",
  Technology: "bg-indigo-100 text-indigo-700",
  Landscape: "bg-green-100 text-green-700",
  General: "bg-gray-100 text-gray-600",
};

type Props = { projectId: string };

export default function PlansTab({ projectId }: Props) {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [viewingSheet, setViewingSheet] = useState<Sheet | null>(null);
  const [editingName, setEditingName] = useState<{
    id: string;
    value: string;
  } | null>(null);
  const [showParamForm, setShowParamForm] = useState(false);
  const [newParam, setNewParam] = useState<{
    name: string;
    type: Parameter["type"];
  }>({ name: "", type: "count" });
  const [filterDiscipline, setFilterDiscipline] = useState("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAll = useCallback(async () => {
    const [sheetsRes, paramsRes] = await Promise.all([
      fetch(`/api/projects/${projectId}/plans`),
      fetch(`/api/projects/${projectId}/plans/parameters`),
    ]);
    if (sheetsRes.ok) {
      const data = (await sheetsRes.json()) as { sheets: Sheet[] };
      setSheets(data.sheets);
    }
    if (paramsRes.ok) {
      const data = (await paramsRes.json()) as { parameters: Parameter[] };
      setParameters(data.parameters);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(`Splitting ${file.name}…`);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/projects/${projectId}/plans/upload`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        alert(err.error ?? "Upload failed.");
        return;
      }
      const data = (await res.json()) as { sheets: Sheet[] };
      setSheets((prev) => [...prev, ...data.sheets]);
    } catch {
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const updateDiscipline = async (sheetId: string, discipline: string) => {
    const res = await fetch(`/api/projects/${projectId}/plans/${sheetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discipline }),
    });
    if (res.ok) {
      setSheets((prev) =>
        prev.map((s) => (s._id === sheetId ? { ...s, discipline } : s))
      );
      if (viewingSheet?._id === sheetId) {
        setViewingSheet((v) => (v ? { ...v, discipline } : v));
      }
    }
  };

  const saveSheetName = async (sheetId: string, sheetName: string) => {
    if (!sheetName.trim()) {
      setEditingName(null);
      return;
    }
    const res = await fetch(`/api/projects/${projectId}/plans/${sheetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheetName: sheetName.trim() }),
    });
    if (res.ok) {
      setSheets((prev) =>
        prev.map((s) =>
          s._id === sheetId ? { ...s, sheetName: sheetName.trim() } : s
        )
      );
    }
    setEditingName(null);
  };

  const deleteSheet = async (sheetId: string) => {
    if (!confirm("Delete this sheet?")) return;
    const res = await fetch(`/api/projects/${projectId}/plans/${sheetId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setSheets((prev) => prev.filter((s) => s._id !== sheetId));
      if (viewingSheet?._id === sheetId) setViewingSheet(null);
    }
  };

  const addParameter = async () => {
    if (!newParam.name.trim()) return;
    const res = await fetch(`/api/projects/${projectId}/plans/parameters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newParam),
    });
    if (res.ok) {
      const data = (await res.json()) as { parameter: Parameter };
      setParameters((prev) => [...prev, data.parameter]);
      setNewParam({ name: "", type: "count" });
      setShowParamForm(false);
    }
  };

  const deleteParameter = async (parameterId: string) => {
    if (!confirm("Delete this parameter?")) return;
    const res = await fetch(
      `/api/projects/${projectId}/plans/parameters/${parameterId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      setParameters((prev) => prev.filter((p) => p._id !== parameterId));
    }
  };

  const usedDisciplines = [
    ...new Set(sheets.map((s) => s.discipline).filter(Boolean)),
  ];

  const filteredSheets =
    filterDiscipline === "all"
      ? sheets
      : sheets.filter((s) => s.discipline === filterDiscipline);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        Loading plans…
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* ── Toolbar ── */}
      {!viewingSheet && (
        <div className="flex flex-wrap items-center gap-2 border-b border-[#E5EAF2] bg-white px-4 py-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 rounded border border-[#E5EAF2] bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            {uploading ? "Processing…" : "Upload Plans"}
          </button>

          {uploadProgress && (
            <span className="text-sm text-gray-500">{uploadProgress}</span>
          )}

          {usedDisciplines.length > 0 && (
            <div className="ml-2 flex flex-wrap items-center gap-1">
              <button
                onClick={() => setFilterDiscipline("all")}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                  filterDiscipline === "all"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              {usedDisciplines.map((d) => (
                <button
                  key={d}
                  onClick={() =>
                    setFilterDiscipline(d === filterDiscipline ? "all" : d)
                  }
                  className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                    filterDiscipline === d
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left: Parameters panel — always visible */}
        <div className="flex w-56 shrink-0 flex-col border-r border-[#E5EAF2] bg-white">
          <div className="border-b border-[#E5EAF2] px-3 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Parameters
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {parameters.length === 0 && !showParamForm && (
              <p className="px-2 py-3 text-xs text-gray-400">
                No parameters yet.
              </p>
            )}

            {parameters.map((p) => (
              <div
                key={p._id}
                className="group mb-0.5 flex items-start gap-1.5 rounded px-2 py-1.5 hover:bg-gray-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-gray-800">{p.name}</div>
                  <span
                    className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${TYPE_COLORS[p.type]}`}
                  >
                    {TYPE_LABELS[p.type]}
                  </span>
                </div>
                <button
                  onClick={() => deleteParameter(p._id)}
                  className="mt-1 hidden shrink-0 text-gray-300 hover:text-red-400 group-hover:block"
                  title="Delete parameter"
                >
                  ×
                </button>
              </div>
            ))}

            {showParamForm ? (
              <div className="mt-2 rounded-lg border border-[#E5EAF2] bg-gray-50 p-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="Parameter name"
                  value={newParam.name}
                  onChange={(e) =>
                    setNewParam((p) => ({ ...p, name: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addParameter();
                    if (e.key === "Escape") {
                      setShowParamForm(false);
                      setNewParam({ name: "", type: "count" });
                    }
                  }}
                  className="mb-1.5 w-full rounded border border-[#E5EAF2] px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
                <select
                  value={newParam.type}
                  onChange={(e) =>
                    setNewParam((p) => ({
                      ...p,
                      type: e.target.value as Parameter["type"],
                    }))
                  }
                  className="mb-2 w-full rounded border border-[#E5EAF2] px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
                >
                  <option value="count">Count</option>
                  <option value="linear">Linear Measurement</option>
                  <option value="sqf">Square Footage (SQF)</option>
                </select>
                <div className="flex gap-1">
                  <button
                    onClick={addParameter}
                    className="flex-1 rounded bg-orange-500 px-2 py-1 text-xs font-medium text-white hover:bg-orange-600"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowParamForm(false);
                      setNewParam({ name: "", type: "count" });
                    }}
                    className="rounded border border-[#E5EAF2] px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowParamForm(true)}
                className="mt-1 flex w-full items-center gap-1 rounded px-2 py-1.5 text-xs text-orange-500 hover:bg-orange-50"
              >
                <span className="text-sm font-medium leading-none">+</span>
                Add Parameter
              </button>
            )}
          </div>
        </div>

        {/* Right: Grid OR inline PDF viewer */}
        {viewingSheet ? (
          <div className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden bg-white">
            {/* Viewer top bar */}
            <div className="flex items-center gap-3 border-b border-[#E5EAF2] px-4 py-2">
              <button
                onClick={() => setViewingSheet(null)}
                className="flex items-center gap-1.5 rounded border border-[#E5EAF2] px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Plans
              </button>

              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="truncate text-sm font-medium text-gray-800">
                  {viewingSheet.sheetName}
                </span>
                <span className="shrink-0 text-xs text-gray-400">
                  p.{viewingSheet.pageNumber}
                </span>
                {viewingSheet.discipline && (
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
                      DISCIPLINE_COLORS[viewingSheet.discipline] ??
                      "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {viewingSheet.discipline}
                  </span>
                )}
              </div>

              {/* Prev / Next navigation */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const idx = sheets.findIndex(
                      (s) => s._id === viewingSheet._id
                    );
                    if (idx > 0) setViewingSheet(sheets[idx - 1]);
                  }}
                  disabled={sheets.findIndex((s) => s._id === viewingSheet._id) === 0}
                  className="rounded border border-[#E5EAF2] px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-30"
                  title="Previous sheet"
                >
                  ‹ Prev
                </button>
                <button
                  onClick={() => {
                    const idx = sheets.findIndex(
                      (s) => s._id === viewingSheet._id
                    );
                    if (idx < sheets.length - 1) setViewingSheet(sheets[idx + 1]);
                  }}
                  disabled={
                    sheets.findIndex((s) => s._id === viewingSheet._id) ===
                    sheets.length - 1
                  }
                  className="rounded border border-[#E5EAF2] px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-30"
                  title="Next sheet"
                >
                  Next ›
                </button>
              </div>
            </div>

            {/* PDF viewer — fills remaining height */}
            <div className="flex-1 min-h-0">
              <PdfViewer
                key={viewingSheet._id}
                url={`/api/projects/${projectId}/plans/${viewingSheet._id}/file`}
                sheetId={viewingSheet._id}
                projectId={projectId}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto bg-white">
            {filteredSheets.length === 0 ? (
              <div className="flex h-52 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white text-center">
                <svg
                  className="mb-3 h-10 w-10 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-sm font-medium text-gray-500">
                  No plan sheets yet
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Upload a PDF — it will be split into individual sheets
                  automatically
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 rounded-lg bg-orange-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-600"
                >
                  Upload Plans
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filteredSheets.map((sheet) => (
                  <SheetCard
                    key={sheet._id}
                    sheet={sheet}
                    projectId={projectId}
                    editingName={editingName}
                    onView={() => setViewingSheet(sheet)}
                    onEditName={() =>
                      setEditingName({ id: sheet._id, value: sheet.sheetName })
                    }
                    onSaveName={(val) => saveSheetName(sheet._id, val)}
                    onEditingChange={(val) =>
                      setEditingName((e) => (e ? { ...e, value: val } : null))
                    }
                    onDisciplineChange={(d) => updateDiscipline(sheet._id, d)}
                    onDelete={() => deleteSheet(sheet._id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

type SheetCardProps = {
  sheet: Sheet;
  projectId: string;
  editingName: { id: string; value: string } | null;
  onView: () => void;
  onEditName: () => void;
  onSaveName: (val: string) => void;
  onEditingChange: (val: string) => void;
  onDisciplineChange: (d: string) => void;
  onDelete: () => void;
};

function SheetCard({
  sheet,
  projectId,
  editingName,
  onView,
  onEditName,
  onSaveName,
  onEditingChange,
  onDisciplineChange,
  onDelete,
}: SheetCardProps) {
  const [showDisciplineMenu, setShowDisciplineMenu] = useState(false);
  const isEditing = editingName?.id === sheet._id;

  return (
    <div className="group relative flex flex-col rounded-lg border border-[#E5EAF2] bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* PDF preview thumbnail — rendered via PDF.js canvas */}
      <div
        className="relative cursor-pointer overflow-hidden rounded-t-lg border-b border-[#E5EAF2]"
        style={{ height: 160 }}
        onClick={onView}
      >
        <PdfThumbnail
          url={`/api/projects/${projectId}/plans/${sheet._id}/file`}
          containerHeight={160}
        />
        <span className="absolute bottom-1.5 right-1.5 rounded bg-gray-700/60 px-1.5 py-0.5 text-[10px] text-white">
          p.{sheet.pageNumber}
        </span>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-1.5 p-2">
        {isEditing ? (
          <input
            autoFocus
            type="text"
            value={editingName.value}
            onChange={(e) => onEditingChange(e.target.value)}
            onBlur={() => onSaveName(editingName.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveName(editingName.value);
              if (e.key === "Escape") onSaveName(sheet.sheetName);
            }}
            className="w-full rounded border border-orange-400 px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
          />
        ) : (
          <button
            onClick={onEditName}
            title={sheet.sheetName}
            className="truncate text-left text-xs font-medium text-gray-800 hover:text-orange-500"
          >
            {sheet.sheetName}
          </button>
        )}

        {/* Discipline selector */}
        <div className="relative">
          <button
            onClick={() => setShowDisciplineMenu((v) => !v)}
            className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
              sheet.discipline
                ? (DISCIPLINE_COLORS[sheet.discipline] ??
                  "bg-gray-100 text-gray-600")
                : "border border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-500"
            }`}
          >
            {sheet.discipline || "+ Discipline"}
          </button>

          {showDisciplineMenu && (
            <div className="absolute bottom-full left-0 z-20 mb-1 w-44 rounded-lg border border-[#E5EAF2] bg-white py-1 shadow-lg">
              {sheet.discipline && (
                <button
                  className="w-full px-3 py-1 text-left text-xs text-gray-400 hover:bg-gray-50"
                  onClick={() => {
                    onDisciplineChange("");
                    setShowDisciplineMenu(false);
                  }}
                >
                  Clear discipline
                </button>
              )}
              {DISCIPLINES.map((d) => (
                <button
                  key={d}
                  className={`w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 ${
                    sheet.discipline === d
                      ? "font-semibold text-orange-500"
                      : "text-gray-700"
                  }`}
                  onClick={() => {
                    onDisciplineChange(d);
                    setShowDisciplineMenu(false);
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Delete sheet"
        className="absolute right-1.5 top-1.5 hidden rounded bg-white/80 p-0.5 text-gray-400 shadow-sm hover:text-red-500 group-hover:block"
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
