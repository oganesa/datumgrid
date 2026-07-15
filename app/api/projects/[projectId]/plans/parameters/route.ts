import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import PlanParameter from "@/models/PlanParameter";

type RouteParams = { params: Promise<{ projectId: string }> };

const VALID_TYPES = ["count", "linear", "sqf"] as const;
type ParameterType = (typeof VALID_TYPES)[number];

function isValidType(t: string): t is ParameterType {
  return (VALID_TYPES as readonly string[]).includes(t);
}

export async function GET(_req: Request, { params }: RouteParams) {
  const { projectId } = await params;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return NextResponse.json({ error: "Invalid project id." }, { status: 400 });
  }

  await connectDB();
  const parameters = await PlanParameter.find({ projectId })
    .sort({ order: 1 })
    .lean();

  return NextResponse.json({
    parameters: parameters.map((p) => ({
      _id: (p._id as mongoose.Types.ObjectId).toString(),
      name: p.name,
      type: p.type,
      order: p.order,
    })),
  });
}

export async function POST(req: Request, { params }: RouteParams) {
  const { projectId } = await params;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return NextResponse.json({ error: "Invalid project id." }, { status: 400 });
  }

  const body = (await req.json()) as { name?: string; type?: string };
  const name = (body.name ?? "").trim();
  const type = body.type ?? "";

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!isValidType(type)) {
    return NextResponse.json(
      { error: "Type must be count, linear, or sqf." },
      { status: 400 }
    );
  }

  await connectDB();

  const last = await PlanParameter.findOne({ projectId })
    .sort({ order: -1 })
    .lean();
  const nextOrder = last ? (last as { order: number }).order + 1 : 0;

  const parameter = await PlanParameter.create({
    projectId: new mongoose.Types.ObjectId(projectId),
    name,
    type,
    order: nextOrder,
  });

  return NextResponse.json(
    {
      parameter: {
        _id: parameter._id.toString(),
        name: parameter.name,
        type: parameter.type,
        order: parameter.order,
      },
    },
    { status: 201 }
  );
}
