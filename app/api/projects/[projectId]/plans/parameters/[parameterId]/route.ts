import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import PlanParameter from "@/models/PlanParameter";

type RouteParams = {
  params: Promise<{ projectId: string; parameterId: string }>;
};

export async function PATCH(req: Request, { params }: RouteParams) {
  const { projectId, parameterId } = await params;

  if (!mongoose.Types.ObjectId.isValid(parameterId)) {
    return NextResponse.json(
      { error: "Invalid parameter id." },
      { status: 400 }
    );
  }

  await connectDB();
  const body = (await req.json()) as { name?: string };

  const update: Record<string, string> = {};
  if (typeof body.name === "string" && body.name.trim()) {
    update.name = body.name.trim();
  }

  const parameter = await PlanParameter.findOneAndUpdate(
    { _id: parameterId, projectId },
    { $set: update },
    { new: true }
  );

  if (!parameter) {
    return NextResponse.json(
      { error: "Parameter not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    parameter: {
      _id: parameter._id.toString(),
      name: parameter.name,
      type: parameter.type,
    },
  });
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { projectId, parameterId } = await params;

  if (!mongoose.Types.ObjectId.isValid(parameterId)) {
    return NextResponse.json(
      { error: "Invalid parameter id." },
      { status: 400 }
    );
  }

  await connectDB();
  const result = await PlanParameter.deleteOne({ _id: parameterId, projectId });

  if (result.deletedCount === 0) {
    return NextResponse.json(
      { error: "Parameter not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
