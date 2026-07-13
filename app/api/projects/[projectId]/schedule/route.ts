import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import ScheduleTask from "@/models/ScheduleTask";

type RouteParams = { params: Promise<{ projectId: string }> };

type RawPred = { taskId: mongoose.Types.ObjectId | string; type: string; lag: number };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeTask(t: Record<string, any>) {
  return {
    ...t,
    _id: t._id?.toString() ?? t._id,
    projectId: t.projectId?.toString() ?? t.projectId,
    parentId: t.parentId ? t.parentId.toString() : null,
    startDate: t.startDate instanceof Date ? t.startDate.toISOString() : (t.startDate ?? null),
    finishDate: t.finishDate instanceof Date ? t.finishDate.toISOString() : (t.finishDate ?? null),
    predecessors: (t.predecessors ?? []).map((p: RawPred) => ({
      taskId: p.taskId?.toString(),
      type: p.type,
      lag: p.lag,
    })),
  };
}

export async function GET(_req: Request, { params }: RouteParams) {
  const { projectId } = await params;
  await connectDB();
  const tasks = await ScheduleTask.find({ projectId }).sort({ order: 1 }).lean();
  return NextResponse.json({ tasks: tasks.map(serializeTask) });
}

export async function POST(req: Request, { params }: RouteParams) {
  const { projectId } = await params;
  await connectDB();
  const body = await req.json() as Record<string, unknown>;
  const task = await ScheduleTask.create({ ...body, projectId });
  return NextResponse.json({ task: serializeTask(task.toObject()) }, { status: 201 });
}

// Bulk update — body: { tasks: Array<{ _id: string } & Partial<fields>> }
export async function PUT(req: Request, { params }: RouteParams) {
  const { projectId } = await params;
  await connectDB();

  const body = await req.json() as { tasks: Array<{ _id: string } & Record<string, unknown>> };
  const { tasks = [] } = body;

  if (tasks.length === 0) return NextResponse.json({ ok: true });

  const ops = tasks.map(({ _id, ...fields }) => ({
    updateOne: {
      filter: { _id: new mongoose.Types.ObjectId(_id), projectId },
      update: { $set: fields },
      upsert: false,
    },
  }));

  await ScheduleTask.bulkWrite(ops);
  return NextResponse.json({ ok: true });
}
