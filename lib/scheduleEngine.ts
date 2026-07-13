// lib/scheduleEngine.ts
// Pure TypeScript scheduling engine — no React/Next.js imports.

export type DependencyType = "FS" | "FF" | "SS" | "SF";
export type TaskMode = "auto" | "manual";

export interface PredecessorLink {
  taskId: string;
  type: DependencyType;
  lag: number; // calendar days; negative = lead
}

export interface TaskForSchedule {
  _id: string;
  order: number;
  outlineLevel: number;
  parentId: string | null;
  taskMode: TaskMode;
  isMilestone: boolean;
  duration: number;
  startDate: string | null;
  finishDate: string | null;
  predecessors: PredecessorLink[];
}

export interface ComputedDates {
  startDate: Date;
  finishDate: Date;
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/** Add calendar days (no weekend skipping). */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Integer days between two dates (to - from). */
export function diffDays(from: Date, to: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((to.getTime() - from.getTime()) / msPerDay);
}

// ---------------------------------------------------------------------------
// Topological sort
// ---------------------------------------------------------------------------

/**
 * DFS-based topological sort.
 * Children must appear before their parents (for summary rollup).
 * Predecessors must appear before their successors.
 * Returns tasks in processing order (leaves first, summaries last).
 */
export function topoSort(tasks: TaskForSchedule[]): TaskForSchedule[] {
  const idToTask = new Map<string, TaskForSchedule>();
  for (const t of tasks) idToTask.set(t._id, t);

  // Build children map
  const childrenOf = new Map<string, string[]>();
  for (const t of tasks) {
    if (t.parentId) {
      const arr = childrenOf.get(t.parentId) ?? [];
      arr.push(t._id);
      childrenOf.set(t.parentId, arr);
    }
  }

  const visited = new Set<string>();
  const inStack = new Set<string>(); // cycle detection
  const result: TaskForSchedule[] = [];

  function visit(id: string) {
    if (visited.has(id)) return;
    if (inStack.has(id)) return; // cycle — skip

    inStack.add(id);
    const task = idToTask.get(id);
    if (task) {
      // Visit predecessors first
      for (const pred of task.predecessors) {
        if (idToTask.has(pred.taskId)) visit(pred.taskId);
      }
      // Visit children first (so parents roll up correctly)
      const children = childrenOf.get(id) ?? [];
      for (const childId of children) {
        visit(childId);
      }
    }
    inStack.delete(id);
    visited.add(id);
    if (task) result.push(task);
  }

  // Visit in stable order
  const sorted = [...tasks].sort((a, b) => a.order - b.order);
  for (const t of sorted) {
    visit(t._id);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Scheduling engine
// ---------------------------------------------------------------------------

export function calculateSchedule(
  tasks: TaskForSchedule[],
  projectStart: Date
): Map<string, ComputedDates> {
  const result = new Map<string, ComputedDates>();
  const idToTask = new Map<string, TaskForSchedule>();
  for (const t of tasks) idToTask.set(t._id, t);

  // Build children map
  const childrenOf = new Map<string, string[]>();
  for (const t of tasks) {
    if (t.parentId && idToTask.has(t.parentId)) {
      const arr = childrenOf.get(t.parentId) ?? [];
      arr.push(t._id);
      childrenOf.set(t.parentId, arr);
    }
  }

  const sorted = topoSort(tasks);

  for (const task of sorted) {
    const isSummary = (childrenOf.get(task._id) ?? []).length > 0;
    const duration = task.isMilestone ? 0 : Math.max(0, task.duration);

    if (isSummary) {
      // Roll up from children
      const children = childrenOf.get(task._id) ?? [];
      const childDates = children
        .map((cid) => result.get(cid))
        .filter((d): d is ComputedDates => d !== undefined);

      if (childDates.length > 0) {
        const minStart = new Date(
          Math.min(...childDates.map((d) => d.startDate.getTime()))
        );
        const maxFinish = new Date(
          Math.max(...childDates.map((d) => d.finishDate.getTime()))
        );
        result.set(task._id, { startDate: minStart, finishDate: maxFinish });
      } else {
        // No resolved children yet — use stored or project start
        const start = task.startDate ? new Date(task.startDate) : projectStart;
        result.set(task._id, { startDate: start, finishDate: addDays(start, duration) });
      }
      continue;
    }

    // Manual mode with both dates — use as-is
    if (task.taskMode === "manual" && task.startDate && task.finishDate) {
      result.set(task._id, {
        startDate: new Date(task.startDate),
        finishDate: new Date(task.finishDate),
      });
      continue;
    }

    // Compute from predecessors
    if (task.predecessors.length === 0) {
      const start = task.startDate ? new Date(task.startDate) : projectStart;
      result.set(task._id, {
        startDate: start,
        finishDate: addDays(start, duration),
      });
      continue;
    }

    let minStart: Date | null = null;
    let minFinish: Date | null = null;

    for (const pred of task.predecessors) {
      const predDates = result.get(pred.taskId);
      if (!predDates) continue;

      switch (pred.type) {
        case "FS": {
          const cs = addDays(predDates.finishDate, pred.lag);
          if (!minStart || cs > minStart) minStart = cs;
          break;
        }
        case "SS": {
          const cs = addDays(predDates.startDate, pred.lag);
          if (!minStart || cs > minStart) minStart = cs;
          break;
        }
        case "FF": {
          const cf = addDays(predDates.finishDate, pred.lag);
          if (!minFinish || cf > minFinish) minFinish = cf;
          break;
        }
        case "SF": {
          const cf = addDays(predDates.startDate, pred.lag);
          if (!minFinish || cf > minFinish) minFinish = cf;
          break;
        }
      }
    }

    // Fallback: if nothing constrained us, use stored or projectStart
    const fallbackStart = task.startDate ? new Date(task.startDate) : projectStart;

    let resolvedStart: Date;
    let resolvedFinish: Date;

    if (minStart && minFinish) {
      // Both constraints — take the one that gives the later finish
      const fromStart = minStart;
      const fromFinish = addDays(minFinish, -duration);
      resolvedStart = fromStart > fromFinish ? fromStart : fromFinish;
      resolvedFinish = addDays(resolvedStart, duration);
    } else if (minStart) {
      resolvedStart = minStart;
      resolvedFinish = addDays(resolvedStart, duration);
    } else if (minFinish) {
      resolvedFinish = minFinish;
      resolvedStart = addDays(resolvedFinish, -duration);
    } else {
      resolvedStart = fallbackStart;
      resolvedFinish = addDays(resolvedStart, duration);
    }

    result.set(task._id, { startDate: resolvedStart, finishDate: resolvedFinish });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Predecessor string parsing / formatting
// ---------------------------------------------------------------------------

// Accepts both type-first (SS2+4) and row-first (2SS+4) formats.
// Groups: [1]=leading type, [2]=row number, [3]=trailing type, [4]=lag
const PRED_RE = /^(FS|FF|SS|SF)?(\d+)(FS|FF|SS|SF)?([+-]\d+)?$/i;

/**
 * Parse predecessor string. Accepts comma-separated parts in two equivalent
 * formats:
 *   Row-first  → "3", "3FS", "2SS+4", "3FF-1"
 *   Type-first → "SS2", "SS2+4", "FF3-1"
 * Omitting the type defaults to FS. Omitting lag defaults to 0.
 */
export function parsePredecessorString(
  str: string,
  rowToId: Map<number, string>
): PredecessorLink[] {
  if (!str.trim()) return [];

  const links: PredecessorLink[] = [];

  for (const part of str.split(",").map((s) => s.trim()).filter(Boolean)) {
    const m = PRED_RE.exec(part);
    if (!m) continue;

    // Type may appear before or after the row number; fall back to FS
    const rawType = m[1] ?? m[3] ?? "FS";
    const depType = rawType.toUpperCase() as DependencyType;
    const rowNum = parseInt(m[2], 10);
    const lag = m[4] ? parseInt(m[4], 10) : 0;

    if (isNaN(rowNum) || rowNum < 1) continue;
    const taskId = rowToId.get(rowNum);
    if (!taskId) continue;

    links.push({ taskId, type: depType, lag });
  }

  return links;
}

/**
 * Format predecessors array back to user-friendly string.
 * "3" if FS with no lag, "3FS+2" if type or lag differs.
 */
export function formatPredecessors(
  predecessors: PredecessorLink[],
  idToRow: Map<string, number>
): string {
  return predecessors
    .map((p) => {
      const row = idToRow.get(p.taskId);
      if (row === undefined) return null;
      let s = String(row);
      if (p.type !== "FS" || p.lag !== 0) {
        s += p.type;
      }
      if (p.lag > 0) s += `+${p.lag}`;
      else if (p.lag < 0) s += String(p.lag);
      return s;
    })
    .filter((s): s is string => s !== null)
    .join(",");
}
