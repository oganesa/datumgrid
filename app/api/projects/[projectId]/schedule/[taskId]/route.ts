import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ScheduleTask from "@/models/ScheduleTask";

type RouteParams = { params: Promise<{ projectId: string; taskId: string }> };

type RawPred = { taskId: { toString(): string }; type: string; lag: number };

export async function PUT(req: Request, { params }: RouteParams) {
  const { projectId, taskId } = await params;
  await connectDB();

  const body = await req.json() as Record<string, unknown>;
  const task = await ScheduleTask.findOneAndUpdate(
    { _id: taskId, projectId },
    { $set: body },
    { new: true }
  );

  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const obj = task.toObject();
  return NextResponse.json({
    task: {
      ...obj,
      _id: obj._id.toString(),
      projectId: obj.projectId.toString(),
      parentId: obj.parentId ? obj.parentId.toString() : null,
      startDate: obj.startDate instanceof Date ? obj.startDate.toISOString() : (obj.startDate ?? null),
      finishDate: obj.finishDate instanceof Date ? obj.finishDate.toISOString() : (obj.finishDate ?? null),
      predecessors: (obj.predecessors ?? []).map((p: RawPred) => ({
        taskId: p.taskId.toString(),
        type: p.type,
        lag: p.lag,
      })),
    },
  });
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { projectId, taskId } = await params;
  await connectDB();
  await ScheduleTask.deleteOne({ _id: taskId, projectId });
  await ScheduleTask.deleteMany({ parentId: taskId, projectId });
  return NextResponse.json({ ok: true });
}
