"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type AiTask = {
  id: string;
  taskName: string;
  outlineLevel?: number;
  duration?: number;
  isMilestone?: boolean;
  predecessors?: { id: string; type?: string; lag?: number }[];
};

type Attachment = {
  name: string;
  mimeType: string;
  data: string; // base64
  previewUrl?: string; // for images
};

type FileSaveResult = {
  fileName: string;
  folderName: string;
  webViewLink?: string;
  status: "saved" | "error";
  error?: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
  scheduleData?: AiTask[] | null;
  savedFiles?: FileSaveResult[];
};

const SCHEDULE_BLOCK_RE = /```schedule-json\s*([\s\S]*?)```/;
const FILE_SAVE_BLOCK_RE = /```file-save-json\s*([\s\S]*?)```/;

type FileSaveDirective = { fileIndex: number; folderId: string; folderName: string; reason?: string };

function extractSchedule(raw: string): { text: string; tasks: AiTask[] | null } {
  const m = SCHEDULE_BLOCK_RE.exec(raw);
  if (!m) return { text: raw, tasks: null };
  try {
    const parsed = JSON.parse(m[1].trim()) as { tasks: AiTask[] };
    const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : null;
    return { text: raw.replace(m[0], "").trim(), tasks };
  } catch {
    return { text: raw, tasks: null };
  }
}

function extractFileSave(raw: string): { text: string; directives: FileSaveDirective[] } {
  const m = FILE_SAVE_BLOCK_RE.exec(raw);
  if (!m) return { text: raw, directives: [] };
  try {
    const parsed = JSON.parse(m[1].trim()) as FileSaveDirective[];
    return { text: raw.replace(m[0], "").trim(), directives: Array.isArray(parsed) ? parsed : [] };
  } catch {
    return { text: raw, directives: [] };
  }
}

const MODELS = [
  { value: "gemini-3.1-flash-lite", label: "3.1 Flash-Lite", desc: "Fastest answers" },
  { value: "gemini-3.5-flash",      label: "3.5 Flash",      desc: "All-around help" },
  { value: "gemini-3.1-pro",        label: "3.1 Pro",        desc: "Advanced math and code" },
  { value: "gemini-3.5-pro",        label: "Extended thinking", desc: "Complex problem solving" },
];
const DEFAULT_MODEL = MODELS[1].value;

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------
function DatumMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="400 850 285 295" fill="#1C2E4A" className="shrink-0" aria-hidden>
      <polygon points="566.72,947.45 547.06,926.76 474.22,996.02 473.93,996.29 473.85,996.37 523.44,1048.54 543.45,1069.58 544.02,1069.04 616.66,999.98 595.61,977.84 595.32,977.54 588.53,970.34 588.54,970.33 574.38,955.38 560.04,969.14 553.35,975.55 567.52,990.5 574.02,984.26 588.57,999.27 581.86,1005.66 544.16,1041.49 501.94,997.08 546.35,954.85 552.37,961.2 554.08,959.57" />
      <rect x="533.85" y="986.77" transform="matrix(0.7247 -0.689 0.689 0.7247 -537.6822 650.4631)" width="22.81" height="22.81" />
      <polygon points="548.64,864.12 440.13,967.29 439.95,967.47 459.19,987.78 547.63,903.71 639.71,1000.56 551.09,1084.77 570.38,1105.11 571.15,1104.36 679.31,1001.56" />
      <polygon points="427.74,979.07 407.45,998.32 537.89,1135.88 541.82,1132.16 541.87,1132.22 558.21,1116.68 427.77,979.04" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Schedule preview card
// ---------------------------------------------------------------------------

function SchedulePreviewCard({
  tasks,
  projectId,
}: {
  tasks: AiTask[];
  projectId: string;
}) {
  const [state, setState] = useState<"idle" | "applying" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const topLevel = tasks.filter((t) => (t.outlineLevel ?? 0) === 0);
  const total = tasks.length;

  async function apply() {
    if (!projectId) {
      setErrorMsg("Open a project first to apply this schedule.");
      setState("error");
      return;
    }
    setState("applying");
    try {
      const res = await fetch(`/api/projects/${projectId}/schedule/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks, replace: true }),
      });
      if (!res.ok) throw new Error("Server error");
      setState("done");
      window.dispatchEvent(new CustomEvent("datumgrid:schedule-refresh"));
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to apply schedule.");
      setState("error");
    }
  }

  return (
    <div className="mt-2 rounded-xl border border-[#4A90E2]/30 bg-[#EBF3FF] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#4A90E2]/10 border-b border-[#4A90E2]/20">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4A90E2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span className="text-[11px] font-semibold text-[#1C2E4A]">
          Schedule Ready — {total} task{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Task preview */}
      <div className="px-3 py-2 space-y-0.5 max-h-36 overflow-y-auto">
        {topLevel.slice(0, 6).map((t) => (
          <div key={t.id} className="flex items-center gap-1.5">
            <span className="text-[#4A90E2] text-[9px] font-bold">▸</span>
            <span className="text-[11px] text-[#1C2E4A] truncate flex-1">{t.taskName}</span>
            {!t.isMilestone && (
              <span className="text-[10px] text-[#6B7280] shrink-0">{t.duration ?? 1}d</span>
            )}
            {t.isMilestone && (
              <span className="text-[10px] text-[#4A90E2] shrink-0">◆</span>
            )}
          </div>
        ))}
        {topLevel.length > 6 && (
          <p className="text-[10px] text-[#9CA3AF] pl-3">+{topLevel.length - 6} more phases…</p>
        )}
      </div>

      {/* Action area */}
      <div className="px-3 py-2 border-t border-[#4A90E2]/20">
        {state === "done" ? (
          <div className="flex items-center gap-1.5 text-emerald-600">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            <span className="text-[11px] font-semibold">Applied to Schedule</span>
          </div>
        ) : state === "error" ? (
          <p className="text-[10px] text-red-500">{errorMsg}</p>
        ) : (
          <button
            type="button"
            onClick={() => void apply()}
            disabled={state === "applying"}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[#1C2E4A] py-1.5 text-[11px] font-semibold text-white hover:opacity-80 disabled:opacity-50 transition-opacity"
          >
            {state === "applying" ? (
              <>
                <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                Applying…
              </>
            ) : (
              <>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /></svg>
                Apply to Schedule
              </>
            )}
          </button>
        )}
        {!projectId && state !== "done" && (
          <p className="mt-1 text-[10px] text-[#9CA3AF] text-center">Open a project to apply</p>
        )}
      </div>
    </div>
  );
}

function FileSaveCard({ files }: { files: FileSaveResult[] }) {
  const savedCount = files.filter(f => f.status === "saved").length;
  const hasErrors = files.some(f => f.status === "error");
  const needsReconnect = files.some(f => f.error?.includes("reconnect") || f.error?.includes("permission") || f.error?.includes("insufficient"));
  const allFailed = savedCount === 0;

  return (
    <div className={`mt-2 rounded-xl border overflow-hidden ${allFailed ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}>
      {/* Header */}
      <div className={`flex items-center gap-2 px-3 py-2 border-b ${allFailed ? "bg-red-100/60 border-red-200" : "bg-emerald-100/60 border-emerald-200"}`}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={allFailed ? "#ef4444" : "#059669"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        <span className={`text-[11px] font-semibold ${allFailed ? "text-red-700" : "text-emerald-800"}`}>
          {allFailed
            ? "File upload failed"
            : `${savedCount} of ${files.length} file${files.length !== 1 ? "s" : ""} saved to Google Drive`}
        </span>
      </div>

      {/* File rows */}
      <div className="px-3 py-2 space-y-1.5">
        {files.map((f, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              {f.status === "saved" ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              ) : (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              )}
              <span className={`flex-1 text-[11px] truncate ${f.status === "saved" ? "text-emerald-900" : "text-red-700"}`}>{f.fileName}</span>
              <span className={`text-[10px] shrink-0 ${f.status === "saved" ? "text-emerald-600" : "text-red-500"}`}>→ {f.folderName}</span>
              {f.webViewLink && (
                <a href={f.webViewLink} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#4A90E2] hover:underline shrink-0">Open</a>
              )}
            </div>
            {f.status === "error" && f.error && (
              <p className="text-[10px] text-red-500 pl-4 leading-snug">{f.error}</p>
            )}
          </div>
        ))}
      </div>

      {/* Reconnect CTA if it's a permissions error */}
      {hasErrors && needsReconnect && (
        <div className="px-3 pb-2.5">
          <a
            href="/settings?section=documents"
            className="flex items-center gap-1.5 text-[11px] font-semibold text-[#4A90E2] hover:underline"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Reconnect Google Drive with write permissions →
          </a>
        </div>
      )}
    </div>
  );
}

function ModelPicker({ model, onChange }: { model: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = MODELS.find((m) => m.value === model) ?? MODELS[1];

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-full border border-[#E5EAF2] bg-[#F7F9FC] px-2.5 py-1 text-[11px] font-medium text-[#374151] hover:border-[#4A90E2] transition-colors"
      >
        {active.label}
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-1.5 w-52 overflow-hidden rounded-xl border border-[#E5EAF2] bg-white shadow-xl">
          {MODELS.map((m, i) => (
            <React.Fragment key={m.value}>
              {i > 0 && <div className="mx-3 border-t border-[#E5EAF2]" />}
              <button
                type="button"
                onClick={() => { onChange(m.value); setOpen(false); }}
                className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-left hover:bg-[#F7F9FC] transition-colors ${m.value === model ? "bg-[#EBF3FF]" : ""}`}
              >
                <span className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${m.value === model ? "border-[#4A90E2] bg-[#4A90E2]" : "border-[#D1D5DB] bg-white"}`} />
                <div>
                  <p className={`text-xs font-semibold ${m.value === model ? "text-[#1C2E4A]" : "text-[#1F2937]"}`}>{m.label}</p>
                  <p className="text-[10px] text-[#6B7280]">{m.desc}</p>
                </div>
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main panel component
// ---------------------------------------------------------------------------
interface Props {
  aiOpen: boolean;
  onToggle: () => void;
}

export default function AiAssistantPanel({ aiOpen, onToggle }: Props) {
  const pathname = usePathname();
  const projectIdMatch = pathname.match(/^\/projects\/([^/]+)/);
  const projectId = projectIdMatch?.[1] ?? "";

  const [messages, setMessages] = useState<Message[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [projectContext, setProjectContext] = useState("");
  // All reachable folders (top-level + subfolders) with IDs — used for file-save classification
  const [allFolders, setAllFolders] = useState<{ folderId: string; folderName: string; path: string }[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("dg_ai_model");
    if (saved && MODELS.some((m) => m.value === saved)) setModel(saved);
  }, []);

  function changeModel(v: string) {
    setModel(v);
    localStorage.setItem("dg_ai_model", v);
  }

  // Load persisted chat history for this project
  useEffect(() => {
    if (!projectId) { setHistoryLoading(false); return; }
    setHistoryLoading(true);
    setMessages([]);
    fetch(`/api/projects/${projectId}/ai-chat`)
      .then((r) => r.ok ? r.json() as Promise<{ messages: Message[] }> : { messages: [] })
      .then(({ messages: hist }) => setMessages(hist))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [projectId]);

  // Persist a single message to the DB (fire-and-forget)
  function persistMessage(msg: Message) {
    if (!projectId) return;
    void fetch(`/api/projects/${projectId}/ai-chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: msg.role,
        content: msg.content,
        attachments: msg.attachments?.map(({ name, mimeType }) => ({ name, mimeType })),
        scheduleData: msg.scheduleData ?? null,
        savedFiles: msg.savedFiles ?? null,
      }),
    });
  }

  async function clearHistory() {
    if (!projectId) return;
    await fetch(`/api/projects/${projectId}/ai-chat`, { method: "DELETE" });
    setMessages([]);
  }

  // Build project document context: fetch linked folders + subfolders + files, include IDs for AI
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;

    async function buildContext() {
      try {
        const fRes = await fetch(`/api/projects/${projectId}/documents/folders`);
        if (!fRes.ok || cancelled) return;
        const { folders } = await fRes.json() as { folders: { folderId: string; folderName: string }[] };
        if (!folders.length || cancelled) return;

        const FOLDER_MIME = "application/vnd.google-apps.folder";

        type DriveItem = { id: string; name: string; mimeType: string; modifiedTime: string };

        // Fetch contents of each linked folder (files + subfolders)
        const folderContents = await Promise.all(
          folders.map(async (f) => {
            try {
              const r = await fetch(`/api/google-drive/files?folderId=${f.folderId}`);
              if (!r.ok) return { folder: f, items: [] as DriveItem[] };
              const d = await r.json() as { items: DriveItem[] };
              return { folder: f, items: d.items ?? [] };
            } catch {
              return { folder: f, items: [] as DriveItem[] };
            }
          })
        );

        if (cancelled) return;

        // For each subfolder, fetch its contents too (one level deeper)
        const subfolderContents = await Promise.all(
          folderContents.flatMap(({ folder: parent, items }) =>
            items
              .filter((i) => i.mimeType === FOLDER_MIME)
              .map(async (sub) => {
                try {
                  const r = await fetch(`/api/google-drive/files?folderId=${sub.id}`);
                  if (!r.ok) return { parentName: parent.folderName, subfolder: sub, items: [] as DriveItem[] };
                  const d = await r.json() as { items: DriveItem[] };
                  return { parentName: parent.folderName, subfolder: sub, items: d.items ?? [] };
                } catch {
                  return { parentName: parent.folderName, subfolder: sub, items: [] as DriveItem[] };
                }
              })
          )
        );

        if (cancelled) return;

        // Build the comprehensive folder list (top-level + subfolders) with IDs
        const reachableFolders: { folderId: string; folderName: string; path: string }[] = [];
        const lines: string[] = [
          "PROJECT DOCUMENT FOLDERS (Google Drive):",
          "Use this to answer questions about documents and to classify files for saving.",
          "Each folder shows its ID — use the exact ID in file-save-json blocks.",
          "",
        ];

        for (const { folder, items } of folderContents) {
          reachableFolders.push({ folderId: folder.folderId, folderName: folder.folderName, path: folder.folderName });
          lines.push(`📁 ${folder.folderName}  [folder-id: ${folder.folderId}]`);

          const subfolders = items.filter((i) => i.mimeType === FOLDER_MIME);
          const files = items.filter((i) => i.mimeType !== FOLDER_MIME);

          for (const sub of subfolders) {
            reachableFolders.push({ folderId: sub.id, folderName: sub.name, path: `${folder.folderName} / ${sub.name}` });
            const subItems = subfolderContents.find((s) => s.subfolder.id === sub.id)?.items ?? [];
            lines.push(`   📁 ${sub.name}  [folder-id: ${sub.id}]`);
            for (const item of subItems.filter((i) => i.mimeType !== FOLDER_MIME)) {
              const date = new Date(item.modifiedTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              lines.push(`      • ${item.name}  modified ${date}`);
            }
            const deepSubfolders = subItems.filter((i) => i.mimeType === FOLDER_MIME);
            for (const ds of deepSubfolders) {
              reachableFolders.push({ folderId: ds.id, folderName: ds.name, path: `${folder.folderName} / ${sub.name} / ${ds.name}` });
              lines.push(`      📁 ${ds.name}  [folder-id: ${ds.id}]`);
            }
          }

          for (const file of files) {
            const date = new Date(file.modifiedTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            lines.push(`   • ${file.name}  modified ${date}`);
          }
          if (items.length === 0) lines.push("   (empty)");
          lines.push("");
        }

        setProjectContext(lines.join("\n"));
        setAllFolders(reachableFolders);
      } catch {
        // non-fatal
      }
    }

    void buildContext();
    return () => { cancelled = true; };
  }, [projectId]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [input]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    files.forEach((file) => {
      if (file.size > 20 * 1024 * 1024) {
        alert(`"${file.name}" is over 20 MB — please attach a smaller file.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1];
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            mimeType: file.type || "application/octet-stream",
            data: base64,
            previewUrl: file.type.startsWith("image/") ? dataUrl : undefined,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  const sendMessage = useCallback(async (text: string, pendingAttachments?: Attachment[]) => {
    const trimmed = text.trim();
    const files = pendingAttachments ?? attachments;
    if ((!trimmed && files.length === 0) || loading) return;

    const userMsg: Message = { role: "user", content: trimmed, attachments: files.length ? files : undefined };
    setMessages((prev) => [...prev, userMsg]);
    persistMessage(userMsg);
    setInput("");
    setAttachments([]);
    setLoading(true);

    try {
      // Use the pre-loaded allFolders (includes subfolders with IDs) for file classification
      const linkedFolders = files.length > 0
        ? allFolders.map(({ folderId, folderName, path }) => ({ folderId, folderName: path || folderName }))
        : [];

      const res = await fetch("/api/ai-assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed || "Please analyze and save the attached file(s) to the appropriate folder.",
          projectId,
          history: messages,
          model,
          attachments: files.map(({ name, mimeType, data }) => ({ name, mimeType, data })),
          linkedFolders,
          projectContext: projectContext || undefined,
        }),
      });
      const data: { text?: string; error?: string } = await res.json();
      const raw = data.text ?? data.error ?? "An error occurred.";

      // Extract schedule block
      const { text: afterSchedule, tasks } = extractSchedule(raw);
      // Extract file-save block
      const { text: responseText, directives } = extractFileSave(afterSchedule);

      // Auto-upload files to the folders the AI chose
      let savedFiles: FileSaveResult[] | undefined;
      if (directives.length > 0 && files.length > 0) {
        const uploads = await Promise.all(
          directives.map(async (d) => {
            const file = files[d.fileIndex];
            if (!file) return { fileName: "unknown", folderName: d.folderName, status: "error" as const, error: "File index out of range" };
            try {
              const up = await fetch("/api/google-drive/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ folderId: d.folderId, fileName: file.name, mimeType: file.mimeType, data: file.data }),
              });
              if (!up.ok) {
                const e = await up.json() as { error?: string; message?: string };
                const errMsg = e.message ?? e.error ?? `Upload failed (${up.status})`;
                return { fileName: file.name, folderName: d.folderName, status: "error" as const, error: errMsg };
              }
              const { file: driveFile } = await up.json() as { file: { webViewLink: string } };
              return { fileName: file.name, folderName: d.folderName, webViewLink: driveFile.webViewLink, status: "saved" as const };
            } catch (e) {
              return { fileName: file.name, folderName: d.folderName, status: "error" as const, error: String(e) };
            }
          })
        );
        savedFiles = uploads;
      }

      const assistantMsg: Message = { role: "assistant", content: responseText, scheduleData: tasks, savedFiles };
      setMessages((prev) => [...prev, assistantMsg]);
      persistMessage(assistantMsg);
    } catch {
      const errMsg: Message = { role: "assistant", content: "Failed to connect to AI assistant." };
      setMessages((prev) => [...prev, errMsg]);
      persistMessage(errMsg);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, messages, model, projectId, attachments, allFolders, projectContext]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  }

  // ── Minimized strip ──────────────────────────────────────────────────────
  if (!aiOpen) {
    return (
      <div className="flex flex-col items-center border-l border-[#E5EAF2] bg-white shrink-0 py-3 gap-3" style={{ width: 44 }}>
        <button
          onClick={onToggle}
          title="Open AI Assistant"
          className="flex items-center justify-center w-7 h-7 rounded text-[#9CA3AF] hover:text-[#1C2E4A] hover:bg-[#F5F5F5] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <DatumMark size={18} />
        <div className="flex-1 flex items-center justify-center">
          <span
            className="text-[10px] font-semibold text-[#6B7280] tracking-widest select-none"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            AI ASSISTANT
          </span>
        </div>
      </div>
    );
  }

  // ── Open panel ───────────────────────────────────────────────────────────
  const isEmpty = messages.length === 0;

  return (
    <div
      className="flex flex-col border-l border-[#E5EAF2] bg-[#F7F9FC] shrink-0"
      style={{ width: "33.333%" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#E5EAF2] bg-white shrink-0">
        <div className="flex items-center gap-2">
          <DatumMark size={16} />
          <span className="text-sm font-semibold text-[#1C2E4A]">AI Assistant</span>
          {projectId && (
            <span className="text-[10px] text-[#9CA3AF] font-medium">· project context</span>
          )}
          {projectContext && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium" title="AI can see your linked Drive folders">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              docs
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={() => void clearHistory()}
              title="Clear chat history"
              className="flex items-center justify-center w-7 h-7 rounded text-[#9CA3AF] hover:text-red-400 hover:bg-[#F5F5F5] transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
              </svg>
            </button>
          )}
          <button
            onClick={onToggle}
            title="Minimize AI Assistant"
            className="flex items-center justify-center w-7 h-7 rounded text-[#9CA3AF] hover:text-[#1C2E4A] hover:bg-[#F5F5F5] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {historyLoading ? (
          <div className="flex items-center justify-center h-full gap-2 text-sm text-[#9CA3AF]">
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            Loading history…
          </div>
        ) : isEmpty ? (
          /* Landing */
          <div className="flex flex-col items-center justify-center h-full gap-5 px-4 py-10">
            <DatumMark size={40} />
            <p className="text-center text-base font-medium text-[#1C2E4A] leading-snug">
              How can I help you today?
            </p>
            {/* Suggestion pills */}
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {[
                { icon: "📋", label: "Analyze project specs" },
                { icon: "💰", label: "Budget insights" },
                { icon: "📅", label: "Plan the schedule" },
                { icon: "📝", label: "Write a report" },
              ].map(({ icon, label }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => void sendMessage(label)}
                  className="flex items-center gap-2 rounded-xl border border-[#E5EAF2] bg-white px-3 py-2 text-sm text-[#374151] hover:border-[#4A90E2] hover:text-[#1C2E4A] transition-colors text-left"
                >
                  <span className="text-base">{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Chat messages */
          <div className="px-4 py-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && <DatumMark size={16} />}
                <div className={`max-w-[85%] ${msg.role === "user" ? "" : "flex-1 min-w-0"}`}>
                  {/* Attachment thumbnails in message */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {msg.attachments.map((a, ai) => (
                        a.previewUrl ? (
                          <img key={ai} src={a.previewUrl} alt={a.name} className="h-20 max-w-[140px] rounded-xl object-cover border border-[#E5EAF2]" />
                        ) : (
                          <div key={ai} className="flex items-center gap-1.5 rounded-xl border border-[#E5EAF2] bg-white px-2.5 py-1.5 text-[11px] text-[#374151]">
                            <span>{a.mimeType.includes("pdf") ? "📄" : "📎"}</span>
                            <span className="max-w-[100px] truncate">{a.name}</span>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                  <div
                    className={`text-[13px] leading-relaxed ${
                      msg.role === "user"
                        ? "rounded-2xl border border-[#E5EAF2] bg-white px-3 py-2 text-[#1F2937] shadow-sm"
                        : "text-[#1F2937]"
                    }`}
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "assistant" && msg.scheduleData && (
                    <SchedulePreviewCard tasks={msg.scheduleData} projectId={projectId} />
                  )}
                  {msg.role === "assistant" && msg.savedFiles && msg.savedFiles.length > 0 && (
                    <FileSaveCard files={msg.savedFiles} />
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2">
                <DatumMark size={16} />
                <div className="flex gap-1">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#4A90E2]"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-[#E5EAF2] bg-white p-3 shrink-0">
        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((a, i) => (
              <div key={i} className="relative flex items-center gap-1.5 rounded-lg border border-[#E5EAF2] bg-[#F7F9FC] px-2 py-1 pr-6 max-w-[160px]">
                {a.previewUrl ? (
                  <img src={a.previewUrl} alt={a.name} className="h-8 w-8 rounded object-cover shrink-0" />
                ) : (
                  <span className="text-base shrink-0">{a.mimeType.includes("pdf") ? "📄" : "📎"}</span>
                )}
                <span className="text-[11px] text-[#374151] truncate">{a.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute right-1 top-1 text-[#9CA3AF] hover:text-red-400 text-xs leading-none"
                  aria-label="Remove"
                >×</button>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl border border-[#E5EAF2] bg-[#F7F9FC] px-3 pt-3 pb-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isEmpty ? "Ask anything about your project…" : "Reply… (Shift+Enter for new line)"}
            rows={1}
            className="w-full resize-none bg-transparent text-[13px] text-[#1F2937] placeholder-[#9CA3AF] outline-none leading-relaxed"
          />
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <ModelPicker model={model} onChange={changeModel} />
              {/* Attach file button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach file or photo"
                className="flex h-6 w-6 items-center justify-center rounded-full text-[#9CA3AF] hover:text-[#4A90E2] hover:bg-[#EBF3FF] transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.txt,.csv,.xlsx,.docx"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <button
              type="button"
              disabled={(!input.trim() && attachments.length === 0) || loading}
              onClick={() => void sendMessage(input)}
              aria-label="Send"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1C2E4A] text-white transition-opacity hover:opacity-80 disabled:opacity-25"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4l8 8h-6v8h-4v-8H4z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
