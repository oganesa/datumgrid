import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import ScheduleTask from "@/models/ScheduleTask";

type RouteParams = { params: Promise<{ projectId: string }> };

interface AiPredecessor {
  id: string;
  type?: string;
  lag?: number;
}

interface AiTask {
  id: string;
  taskName: string;
  outlineLevel?: number;
  duration?: number;
  isMilestone?: boolean;
  predecessors?: AiPredecessor[];
}

export async function POST(req: Request, { params }: RouteParams) {
  const { projectId } = await params;
  await connectDB();

  const body = await req.json() as { tasks: AiTask[]; replace?: boolean };
  const { tasks: aiTasks, replace = true } = body;

  if (!Array.isArray(aiTasks) || aiTasks.length === 0) {
    return NextResponse.json({ error: "No tasks provided." }, { status: 400 });
  }

  // Delete existing tasks if replacing
  if (replace) {
    await ScheduleTask.deleteMany({ projectId });
  }

  // Resolve parentId from outlineLevel using a stack
  const parentStack: Record<number, string> = {}; // outlineLevel → temp id of last task at that level

  const tasksWithMeta = aiTasks.map((t, i) => {
    const level = t.outlineLevel ?? 0;
    const parentTempId = level > 0 ? (parentStack[level - 1] ?? null) : null;

    // Register this task as the latest at its level; clear deeper levels
    parentStack[level] = t.id;
    for (let l = level + 1; l <= 10; l++) delete parentStack[l];

    return {
      ...t,
      order: i + 1,
      level,
      parentTempId,
    };
  });

  // Insert all tasks without predecessors / parentId first (to get real IDs)
  const docs = tasksWithMeta.map((t) => ({
    projectId: new mongoose.Types.ObjectId(projectId),
    order: t.order,
    outlineLevel: t.level,
    parentId: null as mongoose.Types.ObjectId | null,
    taskName: t.taskName ?? "New Task",
    taskMode: "auto" as const,
    isMilestone: t.isMilestone ?? false,
    status: "not-started",
    percentComplete: 0,
    duration: t.isMilestone ? 0 : Math.max(1, t.duration ?? 1),
    predecessors: [] as { taskId: mongoose.Types.ObjectId; type: string; lag: number }[],
  }));

  const inserted = await ScheduleTask.insertMany(docs, { ordered: true });

  // Build tempId → real MongoDB id map
  const tempToReal: Record<string, mongoose.Types.ObjectId> = {};
  tasksWithMeta.forEach((t, i) => {
    tempToReal[t.id] = inserted[i]._id as mongoose.Types.ObjectId;
  });

  // Second pass: resolve parentId and predecessors via bulk update
  const ops = tasksWithMeta
    .map((t, i) => {
      const realId = inserted[i]._id as mongoose.Types.ObjectId;
      const resolvedParentId = t.parentTempId ? (tempToReal[t.parentTempId] ?? null) : null;
      const resolvedPreds = (t.predecessors ?? [])
        .filter((p) => tempToReal[p.id])
        .map((p) => ({
          taskId: tempToReal[p.id],
          type: (p.type ?? "FS").toUpperCase(),
          lag: p.lag ?? 0,
        }));

      const needsUpdate = resolvedParentId !== null || resolvedPreds.length > 0;
      if (!needsUpdate) return null;

      return {
        updateOne: {
          filter: { _id: realId },
          update: {
            $set: {
              ...(resolvedParentId ? { parentId: resolvedParentId } : {}),
              ...(resolvedPreds.length > 0 ? { predecessors: resolvedPreds } : {}),
            },
          },
        },
      };
    })
    .filter((op): op is NonNullable<typeof op> => op !== null);

  if (ops.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await ScheduleTask.bulkWrite(ops as any);
  }

  return NextResponse.json({ ok: true, count: inserted.length });
}
