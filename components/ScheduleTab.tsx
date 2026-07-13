"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  addDays,
  diffDays,
  calculateSchedule,
  formatPredecessors,
  parsePredecessorString,
  type ComputedDates,
  type DependencyType,
  type PredecessorLink,
  type TaskForSchedule,
} from "@/lib/scheduleEngine";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LocalTask = TaskForSchedule & {
  taskName: string;
  status: string;
  percentComplete: number;
  resourceNames: string[];
  isCollapsed: boolean;
  isSummary: boolean;
  computedStart?: Date;
  computedFinish?: Date;
};

type ZoomLevel = "year" | "quarter" | "month";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROW_HEIGHT = 36;
const HEADER_ROWS = 56;
const BAR_HEIGHT = 18;
const BAR_Y_OFFSET = (ROW_HEIGHT - BAR_HEIGHT) / 2;

const ZOOM_PX_PER_DAY: Record<ZoomLevel, number> = {
  year: 2,
  quarter: 5,
  month: 15,
};

const STATUS_OPTIONS = [
  { value: "not-started", label: "Not Started" },
  { value: "in-progress", label: "In Progress" },
  { value: "complete", label: "Complete" },
  { value: "on-hold", label: "On Hold" },
];

const STATUS_COLORS: Record<string, string> = {
  "not-started": "bg-gray-100 text-gray-600",
  "in-progress": "bg-blue-100 text-blue-700",
  "complete": "bg-green-100 text-green-700",
  "on-hold": "bg-yellow-100 text-yellow-700",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getVisible(tasks: LocalTask[]): LocalTask[] {
  const collapsedIds = new Set(tasks.filter((t) => t.isCollapsed).map((t) => t._id));
  return tasks.filter((t) => {
    let pid = t.parentId;
    while (pid) {
      if (collapsedIds.has(pid)) return false;
      pid = tasks.find((p) => p._id === pid)?.parentId ?? null;
    }
    return true;
  });
}

function buildRowMaps(tasks: LocalTask[]): {
  rowToId: Map<number, string>;
  idToRow: Map<string, number>;
} {
  const rowToId = new Map<number, string>();
  const idToRow = new Map<string, number>();
  tasks.forEach((t, i) => {
    const row = i + 1;
    rowToId.set(row, t._id);
    idToRow.set(t._id, row);
  });
  return { rowToId, idToRow };
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ---------------------------------------------------------------------------
// Serialisation helpers for API
// ---------------------------------------------------------------------------

type ApiTaskRaw = {
  _id: string;
  projectId: string;
  order: number;
  outlineLevel: number;
  parentId: string | null;
  taskName: string;
  taskMode: "auto" | "manual";
  isMilestone: boolean;
  status: string;
  percentComplete: number;
  startDate: string | null;
  finishDate: string | null;
  duration: number;
  predecessors: { taskId: string; type: string; lag: number }[];
  resourceNames: string[];
  notes: string;
  isCollapsed: boolean;
};

function apiToLocal(raw: ApiTaskRaw, allTasks: LocalTask[]): LocalTask {
  const isSummary = allTasks.some((t) => t.parentId === raw._id);
  return {
    _id: raw._id,
    order: raw.order,
    outlineLevel: raw.outlineLevel,
    parentId: raw.parentId,
    taskName: raw.taskName,
    taskMode: raw.taskMode,
    isMilestone: raw.isMilestone,
    status: raw.status,
    percentComplete: raw.percentComplete,
    startDate: raw.startDate,
    finishDate: raw.finishDate,
    duration: raw.duration,
    predecessors: raw.predecessors.map((p) => ({
      taskId: p.taskId,
      type: p.type as "FS" | "FF" | "SS" | "SF",
      lag: p.lag,
    })),
    resourceNames: raw.resourceNames,
    isCollapsed: raw.isCollapsed,
    isSummary,
  };
}

// ---------------------------------------------------------------------------
// Gantt SVG
// ---------------------------------------------------------------------------

interface GanttProps {
  visibleTasks: LocalTask[];
  allTasks: LocalTask[];
  zoom: ZoomLevel;
  rangeStart: Date;
  rangeEnd: Date;
  today: Date;
}

function dateToX(date: Date, rangeStart: Date, pxPerDay: number): number {
  const days = (date.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24);
  return days * pxPerDay;
}

function GanttSvg({ visibleTasks, allTasks, zoom, rangeStart, rangeEnd, today }: GanttProps) {
  const pxPerDay = ZOOM_PX_PER_DAY[zoom];
  const totalDays = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24));
  const svgWidth = Math.max(totalDays * pxPerDay, 200);
  const svgHeight = HEADER_ROWS + visibleTasks.length * ROW_HEIGHT;

  // Build year/month headers
  const yearSpans: { year: number; x: number; width: number }[] = [];
  const subHeaders: { label: string; x: number; width: number }[] = [];

  {
    let cur = new Date(rangeStart);
    cur.setDate(1);
    if (cur > rangeStart) {
      cur.setMonth(cur.getMonth() - 1);
      cur.setDate(1);
    }

    while (cur < rangeEnd) {
      const monthStart = new Date(cur);
      const monthEnd = new Date(cur);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const x0 = dateToX(monthStart, rangeStart, pxPerDay);
      const x1 = dateToX(monthEnd, rangeStart, pxPerDay);
      const label =
        zoom === "month"
          ? monthStart.toLocaleString("en-US", { month: "short" })
          : zoom === "quarter"
          ? `Q${Math.floor(monthStart.getMonth() / 3) + 1}`
          : String(monthStart.getFullYear());

      if (zoom === "month") {
        subHeaders.push({ label, x: Math.max(0, x0), width: x1 - x0 });
      } else if (zoom === "quarter") {
        // Group by quarter
        const qIdx = Math.floor(monthStart.getMonth() / 3);
        const last = subHeaders[subHeaders.length - 1];
        if (last && last.label === label && monthStart.getMonth() % 3 !== 0) {
          last.width = x1 - last.x;
        } else {
          subHeaders.push({ label, x: Math.max(0, x0), width: x1 - x0 });
        }
      } else {
        // year zoom — months become sub-labels too sparse; use quarter
        const qLabel = `Q${Math.floor(monthStart.getMonth() / 3) + 1}`;
        const last = subHeaders[subHeaders.length - 1];
        if (last && last.label === qLabel && monthStart.getMonth() % 3 !== 0) {
          last.width = x1 - last.x;
        } else {
          subHeaders.push({ label: qLabel, x: Math.max(0, x0), width: x1 - x0 });
        }
      }

      // Year spans
      const yr = monthStart.getFullYear();
      const lastYear = yearSpans[yearSpans.length - 1];
      if (lastYear && lastYear.year === yr) {
        lastYear.width = x1 - lastYear.x;
      } else {
        yearSpans.push({ year: yr, x: Math.max(0, x0), width: x1 - x0 });
      }

      cur.setMonth(cur.getMonth() + 1);
    }
  }

  const todayX = dateToX(today, rangeStart, pxPerDay);
  const visibleIdSet = new Set(visibleTasks.map((t) => t._id));

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      style={{ display: "block", minWidth: svgWidth }}
    >
      {/* Background rows */}
      {visibleTasks.map((_, i) => (
        <rect
          key={i}
          x={0}
          y={HEADER_ROWS + i * ROW_HEIGHT}
          width={svgWidth}
          height={ROW_HEIGHT}
          fill={i % 2 === 0 ? "#F7F9FC" : "#FFFFFF"}
        />
      ))}

      {/* Weekend shading (month zoom only) */}
      {zoom === "month" && (() => {
        const rects: React.ReactNode[] = [];
        let d = new Date(rangeStart);
        while (d < rangeEnd) {
          const dow = d.getDay();
          if (dow === 0 || dow === 6) {
            const x = dateToX(d, rangeStart, pxPerDay);
            rects.push(
              <rect
                key={d.toISOString()}
                x={x}
                y={HEADER_ROWS}
                width={pxPerDay}
                height={svgHeight - HEADER_ROWS}
                fill="rgba(0,0,0,0.04)"
              />
            );
          }
          d = addDays(d, 1);
        }
        return rects;
      })()}

      {/* Vertical grid lines */}
      {subHeaders.map((sh, i) => (
        <line
          key={i}
          x1={sh.x}
          y1={0}
          x2={sh.x}
          y2={svgHeight}
          stroke="#E5EAF2"
          strokeWidth={1}
        />
      ))}

      {/* Header row 1: Years */}
      <rect x={0} y={0} width={svgWidth} height={28} fill="#1C2E4A" />
      {yearSpans.map((ys, i) => (
        <text
          key={i}
          x={ys.x + 6}
          y={18}
          fill="white"
          fontSize={11}
          fontWeight="600"
          fontFamily="sans-serif"
        >
          {ys.year}
        </text>
      ))}

      {/* Header row 2: Quarters / Months */}
      <rect x={0} y={28} width={svgWidth} height={28} fill="#2D4A6B" />
      {subHeaders.map((sh, i) => (
        <g key={i}>
          <line x1={sh.x} y1={28} x2={sh.x} y2={56} stroke="#1C2E4A" strokeWidth={1} />
          <text
            x={sh.x + 6}
            y={46}
            fill="#AECAEE"
            fontSize={10}
            fontFamily="sans-serif"
          >
            {sh.label}
          </text>
        </g>
      ))}

      {/* Today line */}
      {todayX >= 0 && todayX <= svgWidth && (
        <>
          <line
            x1={todayX}
            y1={0}
            x2={todayX}
            y2={svgHeight}
            stroke="#EF4444"
            strokeWidth={1.5}
            strokeDasharray="4 2"
          />
          <polygon
            points={`${todayX - 5},0 ${todayX + 5},0 ${todayX},8`}
            fill="#EF4444"
          />
        </>
      )}

      {/* Task bars */}
      {visibleTasks.map((task, rowIdx) => {
        const y = HEADER_ROWS + rowIdx * ROW_HEIGHT;
        const barY = y + BAR_Y_OFFSET;
        const startDate = task.computedStart;
        const finishDate = task.computedFinish;

        if (!startDate || !finishDate) {
          // Placeholder bar
          return (
            <rect
              key={task._id}
              x={8}
              y={barY}
              width={60}
              height={BAR_HEIGHT}
              rx={3}
              fill="#E5EAF2"
              opacity={0.5}
            />
          );
        }

        const x0 = dateToX(startDate, rangeStart, pxPerDay);
        const x1 = dateToX(finishDate, rangeStart, pxPerDay);
        const barWidth = Math.max(x1 - x0, task.isMilestone ? 0 : 4);

        if (task.isMilestone) {
          // Diamond
          const cx = x0;
          const cy = y + ROW_HEIGHT / 2;
          const size = 7;
          return (
            <polygon
              key={task._id}
              points={`${cx},${cy - size} ${cx + size},${cy} ${cx},${cy + size} ${cx - size},${cy}`}
              fill="#1C2E4A"
            />
          );
        }

        if (task.isSummary) {
          // Summary bar: thick dark bar with downward triangles at ends
          const barMid = barY + BAR_HEIGHT / 2;
          const triSize = 6;
          return (
            <g key={task._id}>
              <rect
                x={x0}
                y={barMid - 3}
                width={barWidth}
                height={6}
                fill="#1C2E4A"
              />
              {/* Left triangle */}
              <polygon
                points={`${x0},${barMid - 3} ${x0 + triSize},${barMid - 3} ${x0},${barMid + triSize}`}
                fill="#1C2E4A"
              />
              {/* Right triangle */}
              <polygon
                points={`${x0 + barWidth},${barMid - 3} ${x0 + barWidth - triSize},${barMid - 3} ${x0 + barWidth},${barMid + triSize}`}
                fill="#1C2E4A"
              />
            </g>
          );
        }

        // Regular task bar
        const progressWidth = (barWidth * task.percentComplete) / 100;
        return (
          <g key={task._id}>
            <rect
              x={x0}
              y={barY}
              width={barWidth}
              height={BAR_HEIGHT}
              rx={3}
              fill="#4A90E2"
            />
            {task.percentComplete > 0 && (
              <rect
                x={x0}
                y={barY}
                width={progressWidth}
                height={BAR_HEIGHT}
                rx={3}
                fill="#1C2E4A"
              />
            )}
            {/* Task name label on bar if room */}
            {barWidth > 40 && (
              <text
                x={x0 + 4}
                y={barY + BAR_HEIGHT - 5}
                fill="white"
                fontSize={9}
                fontFamily="sans-serif"
              >
                {task.taskName.slice(0, Math.floor(barWidth / 6))}
              </text>
            )}
          </g>
        );
      })}

      {/* Dependency arrows */}
      {visibleTasks.flatMap((task) =>
        task.predecessors
          .filter((pred) => visibleIdSet.has(pred.taskId))
          .map((pred) => {
            const predTask = allTasks.find((t) => t._id === pred.taskId);
            if (!predTask) return null;

            const predRowIdx = visibleTasks.findIndex((t) => t._id === pred.taskId);
            const taskRowIdx = visibleTasks.findIndex((t) => t._id === task._id);
            if (predRowIdx === -1 || taskRowIdx === -1) return null;

            const predFinish = predTask.computedFinish;
            const taskStart = task.computedStart;
            if (!predFinish || !taskStart) return null;

            const x1 = dateToX(predFinish, rangeStart, pxPerDay);
            const y1 = HEADER_ROWS + predRowIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
            const x2 = dateToX(taskStart, rangeStart, pxPerDay);
            const y2 = HEADER_ROWS + taskRowIdx * ROW_HEIGHT + ROW_HEIGHT / 2;

            const mx = x1 + 8;
            const path = `M ${x1} ${y1} L ${mx} ${y1} L ${mx} ${y2} L ${x2} ${y2}`;

            return (
              <g key={`${pred.taskId}-${task._id}`}>
                <path
                  d={path}
                  fill="none"
                  stroke="#6B7280"
                  strokeWidth={1.5}
                  markerEnd="url(#arrowhead)"
                />
              </g>
            );
          })
          .filter((n): n is React.ReactElement => n !== null)
      )}

      {/* Arrow marker def */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="6"
          markerHeight="6"
          refX="3"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 6 3, 0 6" fill="#6B7280" />
        </marker>
      </defs>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Predecessor editor modal
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<DependencyType, string> = {
  FS: "Finish-to-Start — successor cannot start until this task finishes",
  SS: "Start-to-Start — successor cannot start until this task starts",
  FF: "Finish-to-Finish — successor cannot finish until this task finishes",
  SF: "Start-to-Finish — successor cannot finish until this task starts",
};

function PredecessorEditorModal({
  taskId,
  tasks,
  idToRow,
  onSave,
  onClose,
}: {
  taskId: string;
  tasks: LocalTask[];
  idToRow: Map<string, number>;
  onSave: (preds: PredecessorLink[]) => void;
  onClose: () => void;
}) {
  const task = tasks.find((t) => t._id === taskId);
  const rowNum = idToRow.get(taskId);
  const [preds, setPreds] = useState<PredecessorLink[]>(task?.predecessors ?? []);
  const [addTaskId, setAddTaskId] = useState("");
  const [addType, setAddType] = useState<DependencyType>("FS");
  const [addLag, setAddLag] = useState(0);

  if (!task) return null;

  function isDescendantOf(candidateId: string): boolean {
    let cur: LocalTask | undefined = tasks.find((t) => t._id === candidateId);
    const visited = new Set<string>();
    while (cur?.parentId) {
      if (visited.has(cur._id)) break;
      visited.add(cur._id);
      if (cur.parentId === taskId) return true;
      cur = tasks.find((t) => t._id === cur!.parentId);
    }
    return false;
  }

  const available = tasks.filter(
    (t) => t._id !== taskId && !isDescendantOf(t._id) && !preds.some((p) => p.taskId === t._id)
  );

  function addPredecessor() {
    if (!addTaskId) return;
    setPreds((prev) => [...prev, { taskId: addTaskId, type: addType, lag: addLag }]);
    setAddTaskId("");
    setAddLag(0);
  }

  function removePred(id: string) {
    setPreds((prev) => prev.filter((p) => p.taskId !== id));
  }

  function updatePredType(id: string, type: DependencyType) {
    setPreds((prev) => prev.map((p) => (p.taskId === id ? { ...p, type } : p)));
  }

  function updatePredLag(id: string, lag: number) {
    setPreds((prev) => prev.map((p) => (p.taskId === id ? { ...p, lag } : p)));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[500px] max-h-[80vh] flex flex-col"
        style={{ border: "1px solid #E5EAF2" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5EAF2]">
          <div>
            <h2 className="text-sm font-semibold text-[#1C2E4A]">Task Dependencies</h2>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              #{rowNum} · {task.taskName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded text-[#9CA3AF] hover:text-[#1C2E4A] hover:bg-[#F7F9FC] transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Existing predecessors */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {preds.length === 0 ? (
            <p className="text-sm text-[#9CA3AF] text-center py-6">
              No dependencies yet — add one below
            </p>
          ) : (
            preds.map((pred) => {
              const predTask = tasks.find((t) => t._id === pred.taskId);
              const predRow = idToRow.get(pred.taskId) ?? "?";
              return (
                <div
                  key={pred.taskId}
                  className="flex items-center gap-2 rounded-xl border border-[#E5EAF2] bg-[#F7F9FC] px-3 py-2"
                >
                  {/* Row + name */}
                  <span className="text-[11px] font-mono font-semibold text-[#4A90E2] w-5 text-center shrink-0">
                    {predRow}
                  </span>
                  <span className="flex-1 text-xs text-[#1F2937] truncate">
                    {predTask?.taskName ?? "Unknown"}
                  </span>
                  {/* Type buttons */}
                  <div className="flex rounded-lg overflow-hidden border border-[#E5EAF2] shrink-0">
                    {(["FS", "SS", "FF", "SF"] as DependencyType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        title={TYPE_LABELS[t]}
                        onClick={() => updatePredType(pred.taskId, t)}
                        className={`px-2 py-1 text-[10px] font-bold transition-colors ${
                          pred.type === t
                            ? "bg-[#1C2E4A] text-white"
                            : "text-[#9CA3AF] hover:bg-[#EBF3FF] hover:text-[#1C2E4A]"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  {/* Lag */}
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      value={pred.lag}
                      onChange={(e) => updatePredLag(pred.taskId, parseInt(e.target.value, 10) || 0)}
                      className="w-12 text-[11px] border border-[#E5EAF2] rounded-lg px-1.5 py-1 text-center bg-white"
                    />
                    <span className="text-[10px] text-[#9CA3AF]">d</span>
                  </div>
                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removePred(pred.taskId)}
                    className="text-[#D1D5DB] hover:text-red-400 text-lg leading-none transition-colors shrink-0"
                    title="Remove dependency"
                  >
                    ×
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Add new predecessor */}
        <div className="border-t border-[#E5EAF2] px-5 py-4 space-y-3 bg-[#F7F9FC]">
          <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest">
            Add dependency
          </p>
          {/* Task selector */}
          <select
            value={addTaskId}
            onChange={(e) => setAddTaskId(e.target.value)}
            className="w-full text-sm border border-[#E5EAF2] rounded-xl px-3 py-2 text-[#1F2937] bg-white"
          >
            <option value="">Select a task…</option>
            {available.map((t) => (
              <option key={t._id} value={t._id}>
                {idToRow.get(t._id)} · {t.taskName}
              </option>
            ))}
          </select>
          {/* Type + lag + add button row */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl overflow-hidden border border-[#E5EAF2]">
              {(["FS", "SS", "FF", "SF"] as DependencyType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  title={TYPE_LABELS[t]}
                  onClick={() => setAddType(t)}
                  className={`px-3 py-2 text-xs font-bold transition-colors ${
                    addType === t
                      ? "bg-[#1C2E4A] text-white"
                      : "text-[#9CA3AF] bg-white hover:bg-[#EBF3FF] hover:text-[#1C2E4A]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={addLag}
              onChange={(e) => setAddLag(parseInt(e.target.value, 10) || 0)}
              className="w-16 text-sm border border-[#E5EAF2] rounded-xl px-2 py-2 text-center bg-white"
              placeholder="0"
              title="Lag days (negative = lead)"
            />
            <span className="text-xs text-[#9CA3AF] shrink-0">days lag</span>
            <button
              type="button"
              onClick={addPredecessor}
              disabled={!addTaskId}
              className="ml-auto px-4 py-2 bg-[#4A90E2] text-white text-xs font-semibold rounded-xl hover:bg-[#1C2E4A] disabled:opacity-30 transition-colors"
            >
              + Link
            </button>
          </div>
          {/* Selected type description */}
          <p className="text-[11px] text-[#6B7280]">{TYPE_LABELS[addType]}</p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-[#E5EAF2] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#6B7280] hover:text-[#1F2937] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { onSave(preds); onClose(); }}
            className="px-4 py-2 bg-[#1C2E4A] text-white text-sm font-semibold rounded-xl hover:opacity-80 transition-opacity"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ScheduleTab({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<LocalTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ id: string; col: string } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [zoom, setZoom] = useState<ZoomLevel>("quarter");
  const [predecessorModalTaskId, setPredecessorModalTaskId] = useState<string | null>(null);
  const [autoSave, setAutoSave] = useState(true);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropOver, setDropOver] = useState<{ id: string; position: "before" | "after" | "into" } | null>(null);
  const [inlineAdd, setInlineAdd] = useState<{ parentId: string | null; afterId: string | null } | null>(null);
  const [inlineAddValue, setInlineAddValue] = useState("");
  const inlineAddRef = useRef<HTMLInputElement>(null);

  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const predTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const predTimerTaskRef = useRef<string | null>(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // -------------------------------------------------------------------------
  // Derive isSummary for all tasks
  // -------------------------------------------------------------------------
  function markSummaries(list: LocalTask[]): LocalTask[] {
    const parentIds = new Set(list.map((t) => t.parentId).filter(Boolean));
    return list.map((t) => ({ ...t, isSummary: parentIds.has(t._id) }));
  }

  // -------------------------------------------------------------------------
  // Drag-and-drop helpers
  // -------------------------------------------------------------------------
  function getDescendants(taskList: LocalTask[], parentId: string): LocalTask[] {
    const children = taskList
      .filter((t) => t.parentId === parentId)
      .sort((a, b) => a.order - b.order);
    return children.flatMap((c) => [c, ...getDescendants(taskList, c._id)]);
  }

  function moveTask(
    dragTaskId: string,
    dropTaskId: string,
    position: "before" | "after" | "into"
  ) {
    if (dragTaskId === dropTaskId) return;
    const list = [...tasks];
    const dragTask = list.find((t) => t._id === dragTaskId);
    const dropTask = list.find((t) => t._id === dropTaskId);
    if (!dragTask || !dropTask) return;

    // Don't allow dropping a parent onto one of its own descendants
    const descendants = getDescendants(list, dragTaskId);
    if (descendants.some((d) => d._id === dropTaskId)) return;

    const dragGroup = [dragTask, ...descendants];
    const dragIds = new Set(dragGroup.map((t) => t._id));
    const remaining = list.filter((t) => !dragIds.has(t._id));
    const dropIdx = remaining.findIndex((t) => t._id === dropTaskId);
    if (dropIdx === -1) return;

    let newParentId: string | null;
    let newOutlineLevel: number;
    let insertIdx: number;

    if (position === "into") {
      newParentId = dropTaskId;
      newOutlineLevel = dropTask.outlineLevel + 1;
      insertIdx = dropIdx + 1;
    } else if (position === "before") {
      newParentId = dropTask.parentId;
      newOutlineLevel = dropTask.outlineLevel;
      insertIdx = dropIdx;
    } else {
      newParentId = dropTask.parentId;
      newOutlineLevel = dropTask.outlineLevel;
      insertIdx = dropIdx + 1;
    }

    const levelDiff = newOutlineLevel - dragTask.outlineLevel;
    const movedGroup = dragGroup.map((t, i) => ({
      ...t,
      parentId: i === 0 ? newParentId : t.parentId,
      outlineLevel: Math.max(0, t.outlineLevel + levelDiff),
    }));

    const reordered = [
      ...remaining.slice(0, insertIdx),
      ...movedGroup,
      ...remaining.slice(insertIdx),
    ].map((t, i) => ({ ...t, order: (i + 1) * 10 }));

    const updated = markSummaries(reordered);
    setTasks(updated);
    setHasUnsaved(true);
    if (autoSave) {
      // fire-and-forget bulk save
      const realTasks = updated.filter((t) => !t._id.startsWith("temp-"));
      void fetch(`/api/projects/${projectId}/schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: realTasks.map((t) => ({
            _id: t._id, order: t.order, outlineLevel: t.outlineLevel,
            parentId: t.parentId, taskName: t.taskName, taskMode: t.taskMode,
            isMilestone: t.isMilestone, status: t.status,
            percentComplete: t.percentComplete, startDate: t.startDate,
            finishDate: t.finishDate, duration: t.duration,
            predecessors: t.predecessors.filter((p) => !p.taskId.startsWith("temp-")),
            resourceNames: t.resourceNames, isCollapsed: t.isCollapsed,
          })),
        }),
      });
    }
  }

  // -------------------------------------------------------------------------
  // Run schedule engine after state changes
  // -------------------------------------------------------------------------
  function applyEngine(list: LocalTask[]): LocalTask[] {
    const projectStart = today;
    const forEngine: TaskForSchedule[] = list.map((t) => ({
      _id: t._id,
      order: t.order,
      outlineLevel: t.outlineLevel,
      parentId: t.parentId,
      taskMode: t.taskMode,
      isMilestone: t.isMilestone,
      duration: t.duration,
      startDate: t.startDate,
      finishDate: t.finishDate,
      predecessors: t.predecessors,
    }));

    const computed = calculateSchedule(forEngine, projectStart);

    return list.map((t) => {
      const c = computed.get(t._id);
      return c
        ? { ...t, computedStart: c.startDate, computedFinish: c.finishDate }
        : t;
    });
  }

  // -------------------------------------------------------------------------
  // Fetch tasks
  // -------------------------------------------------------------------------
  const loadTasks = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/schedule`);
      if (!res.ok) return;
      const data = await res.json() as { tasks: ApiTaskRaw[] };
      let list: LocalTask[] = data.tasks.map((raw) => apiToLocal(raw, []));
      list = markSummaries(list);
      list = applyEngine(list);
      setTasks(list);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  // Listen for AI-generated schedule applied event
  useEffect(() => {
    function onRefresh() {
      setLoading(true);
      void loadTasks();
    }
    window.addEventListener("datumgrid:schedule-refresh", onRefresh);
    return () => window.removeEventListener("datumgrid:schedule-refresh", onRefresh);
  }, [loadTasks]);

  // Load autosave preference
  useEffect(() => {
    try {
      const stored = localStorage.getItem("dg_schedule_autosave");
      if (stored !== null) setAutoSave(stored === "true");
    } catch {}
  }, []);

  function toggleAutoSave() {
    setAutoSave((prev) => {
      const next = !prev;
      try { localStorage.setItem("dg_schedule_autosave", String(next)); } catch {}
      return next;
    });
  }

  async function saveAll() {
    const realTasks = tasks.filter((t) => !t._id.startsWith("temp-"));
    if (realTasks.length === 0) return;
    setSaving(true);
    try {
      const payload = realTasks.map((t) => ({
        _id: t._id,
        order: t.order,
        outlineLevel: t.outlineLevel,
        parentId: t.parentId,
        taskName: t.taskName,
        taskMode: t.taskMode,
        isMilestone: t.isMilestone,
        status: t.status,
        percentComplete: t.percentComplete,
        startDate: t.startDate,
        finishDate: t.finishDate,
        duration: t.duration,
        predecessors: t.predecessors.filter((p) => !p.taskId.startsWith("temp-")),
        resourceNames: t.resourceNames,
        isCollapsed: t.isCollapsed,
      }));
      await fetch(`/api/projects/${projectId}/schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: payload }),
      });
      setHasUnsaved(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  // -------------------------------------------------------------------------
  // Row / id maps
  // -------------------------------------------------------------------------
  const { rowToId, idToRow } = buildRowMaps(tasks);
  const visibleTasks = getVisible(tasks);

  // -------------------------------------------------------------------------
  // Gantt time range
  // -------------------------------------------------------------------------
  const ganttRange = (() => {
    const starts: Date[] = [];
    const finishes: Date[] = [];
    for (const t of tasks) {
      if (t.computedStart) starts.push(t.computedStart);
      if (t.computedFinish) finishes.push(t.computedFinish);
    }
    starts.push(today);
    finishes.push(addDays(today, 30));
    const minDate = new Date(Math.min(...starts.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...finishes.map((d) => d.getTime())));
    return {
      start: addDays(minDate, -14),
      end: addDays(maxDate, 14),
    };
  })();

  // -------------------------------------------------------------------------
  // Sync scroll
  // -------------------------------------------------------------------------
  function handleLeftScroll() {
    if (rightScrollRef.current && leftScrollRef.current) {
      rightScrollRef.current.scrollTop = leftScrollRef.current.scrollTop;
    }
  }

  // -------------------------------------------------------------------------
  // Cell editing
  // -------------------------------------------------------------------------
  function startEdit(id: string, col: string, value: string) {
    setEditingCell({ id, col });
    setEditValue(value);
  }

  async function commitEdit() {
    if (!editingCell) return;
    const { id, col } = editingCell;
    setEditingCell(null);

    // Compute the patch against the current task snapshot BEFORE setState
    const currentTask = tasks.find((t) => t._id === id);
    if (!currentTask) return;

    const patch: Partial<LocalTask> = {};

    if (col === "taskName") {
      patch.taskName = editValue;

    } else if (col === "duration") {
      const newDur = Math.max(0, parseInt(editValue, 10) || 0);
      patch.duration = newDur;
      // Recalculate finish = start + newDuration
      const base = currentTask.computedStart
        ?? (currentTask.startDate ? new Date(currentTask.startDate) : new Date());
      patch.finishDate = isoDate(addDays(base, newDur));
      if (!currentTask.startDate) patch.startDate = isoDate(base);

    } else if (col === "startDate") {
      patch.startDate = editValue || null;
      if (editValue) {
        const newStart = new Date(editValue);
        // Keep duration, move finish forward
        patch.finishDate = isoDate(addDays(newStart, currentTask.duration));
      }

    } else if (col === "finishDate") {
      patch.finishDate = editValue || null;
      if (editValue) {
        const base = currentTask.computedStart
          ?? (currentTask.startDate ? new Date(currentTask.startDate) : null);
        if (base) {
          const newDur = Math.max(0, diffDays(base, new Date(editValue)));
          patch.duration = newDur;
          if (!currentTask.startDate) patch.startDate = isoDate(base);
        }
      }

    } else if (col === "predecessors") {
      patch.predecessors = parsePredecessorString(editValue, rowToId);

    } else if (col === "percentComplete") {
      patch.percentComplete = Math.min(100, Math.max(0, parseInt(editValue, 10) || 0));

    } else if (col === "status") {
      patch.status = editValue;
    }

    // Apply to local state + re-run engine
    setTasks((prev) => {
      const updated = prev.map((t) => t._id === id ? { ...t, ...patch } : t);
      return applyEngine(markSummaries(updated));
    });

    if (id.startsWith("temp-")) return;

    if (autoSave) {
      try {
        setSaving(true);
        await fetch(`/api/projects/${projectId}/schedule/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
      } finally {
        setSaving(false);
      }
    } else {
      setHasUnsaved(true);
    }
  }

  function cancelEdit() {
    setEditingCell(null);
  }

  async function savePredecessors(taskId: string, preds: PredecessorLink[]) {
    setTasks((prev) => {
      const updated = prev.map((t) =>
        t._id === taskId ? { ...t, predecessors: preds } : t
      );
      return applyEngine(markSummaries(updated));
    });
    if (taskId.startsWith("temp-")) return;
    if (autoSave) {
      try {
        setSaving(true);
        await fetch(`/api/projects/${projectId}/schedule/${taskId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ predecessors: preds }),
        });
      } finally {
        setSaving(false);
      }
    } else {
      setHasUnsaved(true);
    }
  }

  // -------------------------------------------------------------------------
  // Add Task
  // -------------------------------------------------------------------------
  async function addTask(asSummary = false) {
    const selectedTask = tasks.find((t) => t._id === selectedId);
    const maxOrder = tasks.reduce((m, t) => Math.max(m, t.order), 0);
    const newOrder = maxOrder + 1;
    const parentId = selectedTask?.parentId ?? null;
    const outlineLevel = selectedTask ? selectedTask.outlineLevel : 0;

    const tempId = `temp-${Date.now()}`;
    const newTask: LocalTask = {
      _id: tempId,
      order: newOrder,
      outlineLevel: asSummary ? 0 : outlineLevel,
      parentId: asSummary ? null : parentId,
      taskName: asSummary ? "New Group" : "New Task",
      taskMode: "auto",
      isMilestone: false,
      status: "not-started",
      percentComplete: 0,
      startDate: null,
      finishDate: null,
      duration: 1,
      predecessors: [],
      resourceNames: [],
      isCollapsed: false,
      isSummary: false,
    };

    setTasks((prev) => {
      const updated = [...prev, newTask];
      return applyEngine(markSummaries(updated));
    });
    setSelectedId(tempId);

    try {
      setSaving(true);
      const res = await fetch(`/api/projects/${projectId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: newOrder,
          outlineLevel: newTask.outlineLevel,
          parentId: newTask.parentId,
          taskName: newTask.taskName,
          taskMode: "auto",
        }),
      });
      const data = await res.json() as { task: ApiTaskRaw };
      const realId = data.task._id;

      setTasks((prev) => {
        const updated = prev.map((t) =>
          t._id === tempId ? { ...t, _id: realId } : t
        );
        return applyEngine(markSummaries(updated));
      });
      setSelectedId(realId);
    } finally {
      setSaving(false);
    }
  }

  // Focus inline input when it appears
  useEffect(() => {
    if (inlineAdd) setTimeout(() => inlineAddRef.current?.focus(), 30);
  }, [inlineAdd]);

  async function commitInlineAdd() {
    const name = inlineAddValue.trim();
    if (!name || !inlineAdd) { setInlineAdd(null); setInlineAddValue(""); return; }

    const { parentId, afterId } = inlineAdd;
    setInlineAdd(null);
    setInlineAddValue("");

    // Calculate order: insert right after `afterId` if given, else at end of sibling group
    let newOrder: number;
    if (afterId) {
      const afterTask = tasks.find((t) => t._id === afterId);
      // Find next sibling to wedge between
      const siblings = tasks
        .filter((t) => t.parentId === parentId)
        .sort((a, b) => a.order - b.order);
      const afterIdx = siblings.findIndex((t) => t._id === afterId);
      const nextSibling = siblings[afterIdx + 1];
      newOrder = nextSibling
        ? (afterTask!.order + nextSibling.order) / 2
        : (afterTask?.order ?? 0) + 10;
    } else {
      newOrder = tasks.reduce((m, t) => Math.max(m, t.order), 0) + 10;
    }

    const outlineLevel = parentId
      ? (tasks.find((t) => t._id === parentId)?.outlineLevel ?? 0) + 1
      : 0;

    const tempId = `temp-${Date.now()}`;
    const newTask: LocalTask = {
      _id: tempId, order: newOrder, outlineLevel, parentId,
      taskName: name, taskMode: "auto", isMilestone: false,
      status: "not-started", percentComplete: 0,
      startDate: null, finishDate: null, duration: 1,
      predecessors: [], resourceNames: [], isCollapsed: false, isSummary: false,
    };

    setTasks((prev) => applyEngine(markSummaries([...prev, newTask].sort((a, b) => a.order - b.order))));
    setSelectedId(tempId);

    try {
      setSaving(true);
      const res = await fetch(`/api/projects/${projectId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: newOrder, outlineLevel, parentId, taskName: name, taskMode: "auto" }),
      });
      const data = await res.json() as { task: ApiTaskRaw };
      setTasks((prev) => applyEngine(markSummaries(prev.map((t) => t._id === tempId ? { ...t, _id: data.task._id } : t))));
      setSelectedId(data.task._id);
    } finally {
      setSaving(false);
    }
  }

  // -------------------------------------------------------------------------
  // Delete Task
  // -------------------------------------------------------------------------
  async function deleteTask(id: string) {
    // Remove from local state (task + descendants)
    setTasks((prev) => {
      const toRemove = new Set<string>();
      function collect(tid: string) {
        toRemove.add(tid);
        prev.filter((t) => t.parentId === tid).forEach((c) => collect(c._id));
      }
      collect(id);
      const updated = prev.filter((t) => !toRemove.has(t._id));
      return applyEngine(markSummaries(updated));
    });
    if (selectedId === id) setSelectedId(null);

    if (!id.startsWith("temp-")) {
      try {
        await fetch(`/api/projects/${projectId}/schedule/${id}`, {
          method: "DELETE",
        });
      } catch {
        // ignore
      }
    }
  }

  // -------------------------------------------------------------------------
  // Indent / Outdent
  // -------------------------------------------------------------------------
  async function indentTask(id: string) {
    const idx = tasks.findIndex((t) => t._id === id);
    if (idx <= 0) return;
    const prev = tasks[idx - 1];
    if (!prev) return;

    setTasks((prevList) => {
      const updated = prevList.map((t) =>
        t._id === id
          ? { ...t, outlineLevel: t.outlineLevel + 1, parentId: prev._id }
          : t
      );
      return applyEngine(markSummaries(updated));
    });

    if (!id.startsWith("temp-")) {
      await fetch(`/api/projects/${projectId}/schedule/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outlineLevel: (tasks[idx]?.outlineLevel ?? 0) + 1, parentId: prev._id }),
      });
    }
  }

  async function outdentTask(id: string) {
    const task = tasks.find((t) => t._id === id);
    if (!task || task.outlineLevel <= 0) return;
    const parent = task.parentId ? tasks.find((t) => t._id === task.parentId) : null;
    const newParentId = parent?.parentId ?? null;
    const newLevel = Math.max(0, task.outlineLevel - 1);

    setTasks((prevList) => {
      const updated = prevList.map((t) =>
        t._id === id ? { ...t, outlineLevel: newLevel, parentId: newParentId } : t
      );
      return applyEngine(markSummaries(updated));
    });

    if (!id.startsWith("temp-")) {
      await fetch(`/api/projects/${projectId}/schedule/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outlineLevel: newLevel, parentId: newParentId }),
      });
    }
  }

  // -------------------------------------------------------------------------
  // Toggle collapse
  // -------------------------------------------------------------------------
  function toggleCollapse(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t._id === id ? { ...t, isCollapsed: !t.isCollapsed } : t))
    );
  }

  // -------------------------------------------------------------------------
  // Keyboard handling
  // -------------------------------------------------------------------------
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Delete" || e.key === "Backspace") {
      if (!editingCell && selectedId) {
        e.preventDefault();
        deleteTask(selectedId);
      }
    } else if (e.key === "Escape") {
      cancelEdit();
      setSelectedId(null);
    }
  }

  function handleCellKeyDown(e: React.KeyboardEvent<HTMLInputElement>, id: string, col: string) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
      // Move to next row
      const idx = visibleTasks.findIndex((t) => t._id === id);
      if (idx >= 0 && idx < visibleTasks.length - 1) {
        const next = visibleTasks[idx + 1];
        if (next) {
          setSelectedId(next._id);
          startEdit(next._id, col, getCellValue(next, col));
        }
      }
    } else if (e.key === "Escape") {
      cancelEdit();
    } else if (e.key === "Tab") {
      e.preventDefault();
      commitEdit();
      // Move to next editable column
      const cols = ["taskName", "duration", "startDate", "finishDate", "predecessors", "percentComplete", "status"];
      const ci = cols.indexOf(col);
      const nextCol = cols[(ci + 1) % cols.length];
      if (nextCol) startEdit(id, nextCol, getCellValue(tasks.find((t) => t._id === id)!, nextCol));
    }
  }

  function getCellValue(task: LocalTask, col: string): string {
    if (col === "taskName") return task.taskName;
    if (col === "duration") return String(task.duration);
    if (col === "startDate") return task.computedStart ? isoDate(task.computedStart) : "";
    if (col === "finishDate") return task.computedFinish ? isoDate(task.computedFinish) : "";
    if (col === "predecessors") return formatPredecessors(task.predecessors, idToRow);
    if (col === "percentComplete") return String(task.percentComplete);
    if (col === "status") return task.status;
    return "";
  }

  // -------------------------------------------------------------------------
  // Render cell
  // -------------------------------------------------------------------------
  function renderCell(task: LocalTask, col: string) {
    const isEditing = editingCell?.id === task._id && editingCell?.col === col;
    const value = getCellValue(task, col);

    if (isEditing) {
      if (col === "status") {
        return (
          <select
            autoFocus
            value={editValue}
            className="w-full h-full border-0 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#4A90E2] px-1"
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => commitEdit()}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        );
      }
      if (col === "startDate" || col === "finishDate") {
        return (
          <input
            ref={(el) => {
              if (el) {
                el.focus();
                try { el.showPicker(); } catch { /* not all browsers support */ }
              }
            }}
            type="date"
            value={editValue}
            className="w-full h-full border-0 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#4A90E2] px-1"
            onChange={(e) => { setEditValue(e.target.value); }}
            onBlur={() => commitEdit()}
            onKeyDown={(e) => handleCellKeyDown(e, task._id, col)}
          />
        );
      }
      return (
        <input
          autoFocus
          type={col === "duration" || col === "percentComplete" ? "number" : "text"}
          value={editValue}
          className="w-full h-full border-0 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#4A90E2] px-1"
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => commitEdit()}
          onKeyDown={(e) => handleCellKeyDown(e, task._id, col)}
          min={col === "percentComplete" ? 0 : undefined}
          max={col === "percentComplete" ? 100 : undefined}
        />
      );
    }

    if (col === "status") {
      return (
        <span
          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_COLORS[task.status] ?? "bg-gray-100 text-gray-600"}`}
        >
          {STATUS_OPTIONS.find((o) => o.value === task.status)?.label ?? task.status}
        </span>
      );
    }

    if (col === "startDate") return formatDate(task.computedStart);
    if (col === "finishDate") return formatDate(task.computedFinish);
    if (col === "duration") return `${task.duration}d`;
    if (col === "percentComplete") return `${task.percentComplete}%`;

    return value;
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading schedule...
      </div>
    );
  }

  return (
    <div
      className="flex flex-col"
      style={{ height: "calc(100vh - 10rem)" }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#E5EAF2] bg-white flex-shrink-0">
        <button
          onClick={() => addTask(false)}
          className="px-3 py-1.5 bg-[#4A90E2] text-white text-xs rounded hover:bg-[#1C2E4A] transition-colors"
        >
          + Add Task
        </button>
        <button
          onClick={() => addTask(true)}
          className="px-3 py-1.5 bg-[#7FB3FF] text-[#1C2E4A] text-xs rounded hover:bg-[#4A90E2] hover:text-white transition-colors"
        >
          + Add Group
        </button>
        <div className="w-px h-5 bg-[#E5EAF2] mx-1" />
        <button
          disabled={!selectedId}
          onClick={() => selectedId && indentTask(selectedId)}
          className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 disabled:opacity-40 transition-colors"
          title="Indent (make child)"
        >
          ⬇ Indent
        </button>
        <button
          disabled={!selectedId}
          onClick={() => selectedId && outdentTask(selectedId)}
          className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 disabled:opacity-40 transition-colors"
          title="Outdent (promote)"
        >
          ⬆ Outdent
        </button>
        <button
          disabled={!selectedId}
          onClick={() => selectedId && deleteTask(selectedId)}
          className="px-3 py-1.5 bg-red-50 text-red-600 text-xs rounded hover:bg-red-100 disabled:opacity-40 transition-colors"
        >
          Delete
        </button>
        <div className="flex-1" />

        {/* Save + Autosave */}
        <div className="flex items-center gap-2">
          {/* Status text */}
          {saving && (
            <span className="text-[11px] text-[#9CA3AF] animate-pulse">Saving…</span>
          )}
          {!saving && savedFlash && (
            <span className="text-[11px] text-emerald-500 font-medium">Saved</span>
          )}
          {!saving && !savedFlash && !autoSave && hasUnsaved && (
            <span className="text-[11px] text-amber-500 font-medium">Unsaved changes</span>
          )}

          {/* Save button */}
          <button
            onClick={() => void saveAll()}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C2E4A] text-white text-xs font-semibold rounded hover:opacity-80 disabled:opacity-40 transition-opacity"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 3h11l5 5v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm7 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm3-14H8v4h7V3z"/>
            </svg>
            Save
          </button>

          {/* Autosave toggle */}
          <button
            type="button"
            onClick={toggleAutoSave}
            title={autoSave ? "Autosave ON — click to turn off" : "Autosave OFF — click to turn on"}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-medium transition-colors select-none"
            style={{
              borderColor: autoSave ? "#10B981" : "#E5EAF2",
              color: autoSave ? "#10B981" : "#9CA3AF",
              backgroundColor: autoSave ? "#F0FDF4" : "#F7F9FC",
            }}
          >
            {/* Pill switch */}
            <span
              className="relative inline-flex h-4 w-7 rounded-full transition-colors"
              style={{ backgroundColor: autoSave ? "#10B981" : "#D1D5DB" }}
            >
              <span
                className="absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform"
                style={{ left: autoSave ? "calc(100% - 14px)" : "2px" }}
              />
            </span>
            Autosave
          </button>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded p-0.5">
          {(["year", "quarter", "month"] as ZoomLevel[]).map((z) => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className={`px-2 py-1 text-xs rounded transition-colors ${zoom === z ? "bg-white shadow text-[#1C2E4A] font-medium" : "text-gray-500 hover:text-gray-800"}`}
            >
              {z === "year" ? "Y" : z === "quarter" ? "Q" : "M"}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            // Scroll Gantt to today
            if (rightScrollRef.current) {
              const pxPerDay = ZOOM_PER_DAY_VALUE(zoom);
              const days = (today.getTime() - ganttRange.start.getTime()) / (1000 * 60 * 60 * 24);
              rightScrollRef.current.scrollLeft = Math.max(0, days * pxPerDay - 200);
            }
          }}
          className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors"
        >
          Today
        </button>
      </div>

      {/* Split view */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Task table */}
        <div
          ref={leftScrollRef}
          onScroll={handleLeftScroll}
          className="overflow-y-auto overflow-x-auto flex-shrink-0 border-r border-[#E5EAF2]"
          style={{ width: 640 }}
        >
          <table className="border-collapse text-xs" style={{ minWidth: 640 }}>
            <thead className="sticky top-0 z-10">
              <tr style={{ height: 28 }} className="bg-[#1C2E4A] text-white">
                <th style={{ width: 20 }} className="border-r border-[#2D4A6B] px-0"></th>
                <th style={{ width: 28 }} className="border-r border-[#2D4A6B] px-1 text-center font-normal text-[10px]"></th>
                <th style={{ width: 36 }} className="border-r border-[#2D4A6B] px-1 text-center font-normal text-[10px]">#</th>
                <th style={{ width: 240 }} className="border-r border-[#2D4A6B] px-2 text-left font-medium text-[10px]">Task Name</th>
                <th style={{ width: 60 }} className="border-r border-[#2D4A6B] px-1 text-center font-normal text-[10px]">Dur</th>
                <th style={{ width: 90 }} className="border-r border-[#2D4A6B] px-1 text-center font-normal text-[10px]">Start</th>
                <th style={{ width: 90 }} className="border-r border-[#2D4A6B] px-1 text-center font-normal text-[10px]">Finish</th>
                <th style={{ width: 70 }} className="border-r border-[#2D4A6B] px-1 text-center font-normal text-[10px]">Pred</th>
                <th style={{ width: 50 }} className="border-r border-[#2D4A6B] px-1 text-center font-normal text-[10px]">%</th>
                <th style={{ width: 100 }} className="px-1 text-center font-normal text-[10px]">Status</th>
              </tr>
              {/* Spacer header row to match gantt header height */}
              <tr style={{ height: 28 }} className="bg-[#2D4A6B] text-[#AECAEE]">
                <th colSpan={10} className="font-normal text-[10px] px-2 text-left">
                  {tasks.length} task{tasks.length !== 1 ? "s" : ""}
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-gray-400 text-sm">
                    No tasks yet — click <strong>+ Add Task</strong> or <strong>+ Add Group</strong> to get started.
                  </td>
                </tr>
              )}
              {visibleTasks.map((task) => {
                const rowNum = idToRow.get(task._id) ?? 0;
                const isSelected = selectedId === task._id;
                const indent = task.outlineLevel * 16;
                const hasSummary = task.isSummary;

                const isDragging = dragId === task._id;
                const isDropTarget = dropOver?.id === task._id;
                const dropPos = isDropTarget ? dropOver!.position : null;

                return (
                  <tr
                    key={task._id}
                    style={{
                      height: ROW_HEIGHT,
                      opacity: isDragging ? 0.35 : 1,
                      borderTop: dropPos === "before" ? "2px solid #4A90E2" : undefined,
                      borderBottom: dropPos === "after" ? "2px solid #4A90E2" : undefined,
                      outline: dropPos === "into" ? "2px solid #4A90E2" : undefined,
                      outlineOffset: "-2px",
                    }}
                    className={`border-b border-[#E5EAF2] cursor-pointer select-none ${isSelected ? "bg-[#EBF3FD]" : "hover:bg-[#F7F9FC]"}`}
                    onClick={() => setSelectedId(task._id)}
                    onDoubleClick={() => startEdit(task._id, "taskName", task.taskName)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      const rect = e.currentTarget.getBoundingClientRect();
                      const relY = e.clientY - rect.top;
                      const ratio = relY / rect.height;
                      let position: "before" | "after" | "into";
                      if (hasSummary && ratio > 0.25 && ratio < 0.75) {
                        position = "into";
                      } else if (ratio < 0.5) {
                        position = "before";
                      } else {
                        position = "after";
                      }
                      setDropOver((prev) =>
                        prev?.id === task._id && prev?.position === position
                          ? prev
                          : { id: task._id, position }
                      );
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setDropOver(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const srcId = e.dataTransfer.getData("text/plain");
                      const rect = e.currentTarget.getBoundingClientRect();
                      const relY = e.clientY - rect.top;
                      const ratio = relY / rect.height;
                      let position: "before" | "after" | "into";
                      if (hasSummary && ratio > 0.25 && ratio < 0.75) {
                        position = "into";
                      } else if (ratio < 0.5) {
                        position = "before";
                      } else {
                        position = "after";
                      }
                      if (srcId) moveTask(srcId, task._id, position);
                      setDragId(null);
                      setDropOver(null);
                    }}
                  >
                    {/* Drag handle */}
                    <td
                      className="border-r border-[#E5EAF2] text-center px-0 text-[#C0C8D8] hover:text-[#4A90E2] transition-colors"
                      style={{ width: 20, cursor: "grab" }}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", task._id);
                        e.dataTransfer.effectAllowed = "move";
                        setDragId(task._id);
                      }}
                      onDragEnd={() => { setDragId(null); setDropOver(null); }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" style={{ margin: "0 auto" }}>
                        <circle cx="3" cy="2.5" r="1.2" /><circle cx="7" cy="2.5" r="1.2" />
                        <circle cx="3" cy="7" r="1.2" /><circle cx="7" cy="7" r="1.2" />
                        <circle cx="3" cy="11.5" r="1.2" /><circle cx="7" cy="11.5" r="1.2" />
                      </svg>
                    </td>

                    {/* Expand/collapse */}
                    <td className="border-r border-[#E5EAF2] text-center px-0.5">
                      {hasSummary ? (
                        <button
                          className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-800"
                          onClick={(e) => { e.stopPropagation(); toggleCollapse(task._id); }}
                        >
                          {task.isCollapsed ? "▶" : "▼"}
                        </button>
                      ) : null}
                    </td>

                    {/* Row number */}
                    <td className="border-r border-[#E5EAF2] text-center text-gray-400 text-[10px]">
                      {rowNum}
                    </td>

                    {/* Task name */}
                    <td
                      className="border-r border-[#E5EAF2] px-1"
                      style={{ paddingLeft: indent + 4 }}
                      onDoubleClick={(e) => { e.stopPropagation(); startEdit(task._id, "taskName", task.taskName); }}
                    >
                      {editingCell?.id === task._id && editingCell?.col === "taskName" ? (
                        renderCell(task, "taskName")
                      ) : (
                        <span className={`truncate block ${hasSummary ? "font-semibold text-[#1C2E4A]" : "text-[#1F2937]"}`}>
                          {task.isMilestone && <span className="mr-1 text-[#1C2E4A]">◆</span>}
                          {task.taskName}
                        </span>
                      )}
                    </td>

                    {/* Duration */}
                    <td
                      className="border-r border-[#E5EAF2] text-center text-gray-600 cursor-text"
                      onClick={(e) => { e.stopPropagation(); setSelectedId(task._id); if (!hasSummary) startEdit(task._id, "duration", String(task.duration)); }}
                    >
                      {editingCell?.id === task._id && editingCell?.col === "duration"
                        ? renderCell(task, "duration")
                        : hasSummary ? "" : `${task.duration}d`}
                    </td>

                    {/* Start */}
                    <td
                      className="border-r border-[#E5EAF2] text-center text-gray-600 text-[10px] cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); setSelectedId(task._id); startEdit(task._id, "startDate", task.computedStart ? isoDate(task.computedStart) : ""); }}
                    >
                      {editingCell?.id === task._id && editingCell?.col === "startDate"
                        ? renderCell(task, "startDate")
                        : task.computedStart
                          ? task.computedStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                          : <span className="text-gray-300">Pick date</span>}
                    </td>

                    {/* Finish */}
                    <td
                      className="border-r border-[#E5EAF2] text-center text-gray-600 text-[10px] cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); setSelectedId(task._id); startEdit(task._id, "finishDate", task.computedFinish ? isoDate(task.computedFinish) : ""); }}
                    >
                      {editingCell?.id === task._id && editingCell?.col === "finishDate"
                        ? renderCell(task, "finishDate")
                        : task.computedFinish
                          ? task.computedFinish.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                          : <span className="text-gray-300">Pick date</span>}
                    </td>

                    {/* Predecessors — single click → modal, double click → text input */}
                    <td
                      className="border-r border-[#E5EAF2] text-center cursor-pointer hover:bg-[#EBF3FF] transition-colors"
                      title="Click to open dependency editor · Double-click to type manually"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(task._id);
                        if (predTimerTaskRef.current === task._id && predTimerRef.current !== null) {
                          // Second click within timeout → treat as double-click → inline text
                          clearTimeout(predTimerRef.current);
                          predTimerRef.current = null;
                          predTimerTaskRef.current = null;
                          startEdit(task._id, "predecessors", formatPredecessors(task.predecessors, idToRow));
                        } else {
                          if (predTimerRef.current) clearTimeout(predTimerRef.current);
                          predTimerTaskRef.current = task._id;
                          predTimerRef.current = setTimeout(() => {
                            predTimerRef.current = null;
                            predTimerTaskRef.current = null;
                            setPredecessorModalTaskId(task._id);
                          }, 260);
                        }
                      }}
                    >
                      {editingCell?.id === task._id && editingCell?.col === "predecessors"
                        ? renderCell(task, "predecessors")
                        : task.predecessors.length === 0
                          ? <span className="text-[#D1D5DB] text-[10px]">+</span>
                          : (
                            <div className="flex flex-wrap gap-0.5 justify-center px-1">
                              {task.predecessors.map((p) => {
                                const row = idToRow.get(p.taskId);
                                const label = `${row ?? "?"}${p.type !== "FS" ? p.type : ""}${p.lag > 0 ? `+${p.lag}` : p.lag < 0 ? p.lag : ""}`;
                                return (
                                  <span
                                    key={p.taskId}
                                    className="inline-block rounded bg-[#EBF3FF] text-[#1C2E4A] text-[9px] px-1.5 py-0.5 font-semibold"
                                  >
                                    {label}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                    </td>

                    {/* % Complete */}
                    <td
                      className="border-r border-[#E5EAF2] text-center text-gray-600"
                      onDoubleClick={() => startEdit(task._id, "percentComplete", String(task.percentComplete))}
                    >
                      {editingCell?.id === task._id && editingCell?.col === "percentComplete"
                        ? renderCell(task, "percentComplete")
                        : hasSummary ? "" : `${task.percentComplete}%`}
                    </td>

                    {/* Status */}
                    <td
                      className="text-center cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); setSelectedId(task._id); startEdit(task._id, "status", task.status); }}
                    >
                      {editingCell?.id === task._id && editingCell?.col === "status"
                        ? renderCell(task, "status")
                        : renderCell(task, "status")}
                    </td>
                  </tr>
                );
              })}

              {/* Inline add: active input row */}
              {inlineAdd && (
                <tr>
                  <td />
                  <td />
                  <td />
                  <td colSpan={7} className="px-2 py-0.5">
                    <input
                      ref={inlineAddRef}
                      value={inlineAddValue}
                      onChange={(e) => setInlineAddValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); void commitInlineAdd(); }
                        if (e.key === "Escape") { setInlineAdd(null); setInlineAddValue(""); }
                      }}
                      onBlur={() => {
                        if (!inlineAddValue.trim()) { setInlineAdd(null); setInlineAddValue(""); }
                        else void commitInlineAdd();
                      }}
                      placeholder="New task name…"
                      className="w-full text-sm px-2 py-1 border border-[#4A90E2] rounded outline-none"
                    />
                  </td>
                </tr>
              )}

              {/* Quick-add footer row */}
              {!inlineAdd && (
                <tr>
                  <td colSpan={10} className="py-1 select-none border-t border-[#F0F3F8]">
                    <span
                      className="inline-flex items-center px-3 text-xs text-[#B0BAC9] hover:text-[#4A90E2] cursor-pointer transition-colors"
                      onClick={() => {
                        const lastTask = visibleTasks[visibleTasks.length - 1];
                        setInlineAdd({ parentId: null, afterId: lastTask?._id ?? null });
                      }}
                    >
                      + Add task
                    </span>
                    <span className="text-[#D1D5DB] text-xs">|</span>
                    <span
                      className="inline-flex items-center px-3 text-xs text-[#B0BAC9] hover:text-[#4A90E2] cursor-pointer transition-colors"
                      onClick={() => void addTask(true)}
                    >
                      + Add group
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Right: Gantt */}
        <div
          ref={rightScrollRef}
          className="flex-1 overflow-x-auto overflow-y-scroll"
          style={{ minWidth: 0, scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <GanttSvg
            visibleTasks={visibleTasks}
            allTasks={tasks}
            zoom={zoom}
            rangeStart={ganttRange.start}
            rangeEnd={ganttRange.end}
            today={today}
          />
        </div>
      </div>

      {/* Predecessor editor modal */}
      {predecessorModalTaskId && (
        <PredecessorEditorModal
          taskId={predecessorModalTaskId}
          tasks={tasks}
          idToRow={idToRow}
          onSave={(preds) => void savePredecessors(predecessorModalTaskId, preds)}
          onClose={() => setPredecessorModalTaskId(null)}
        />
      )}
    </div>
  );
}

// Helper to get pxPerDay outside the constant object
function ZOOM_PER_DAY_VALUE(zoom: ZoomLevel): number {
  return ZOOM_PX_PER_DAY[zoom];
}
