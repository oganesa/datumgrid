import { NextResponse } from "next/server";
import mongoose from "mongoose";
import fs from "fs/promises";

import { connectDB } from "@/lib/mongodb";
import PlanSheet from "@/models/PlanSheet";
import { planFileAbsolutePath } from "@/lib/plan-storage";

type RouteParams = { params: Promise<{ projectId: string; sheetId: string }> };

export async function PATCH(req: Request, { params }: RouteParams) {
  const { projectId, sheetId } = await params;

  if (!mongoose.Types.ObjectId.isValid(sheetId)) {
    return NextResponse.json({ error: "Invalid sheet id." }, { status: 400 });
  }

  await connectDB();
  const body = (await req.json()) as {
    sheetName?: string;
    discipline?: string;
  };

  const update: Record<string, string> = {};
  if (typeof body.sheetName === "string" && body.sheetName.trim()) {
    update.sheetName = body.sheetName.trim();
  }
  if (typeof body.discipline === "string") {
    update.discipline = body.discipline;
  }

  const sheet = await PlanSheet.findOneAndUpdate(
    { _id: sheetId, projectId },
    { $set: update },
    { new: true }
  );

  if (!sheet) {
    return NextResponse.json({ error: "Sheet not found." }, { status: 404 });
  }

  return NextResponse.json({
    sheet: {
      _id: sheet._id.toString(),
      sheetName: sheet.sheetName,
      discipline: sheet.discipline,
    },
  });
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { projectId, sheetId } = await params;

  if (!mongoose.Types.ObjectId.isValid(sheetId)) {
    return NextResponse.json({ error: "Invalid sheet id." }, { status: 400 });
  }

  await connectDB();
  const sheet = await PlanSheet.findOne({ _id: sheetId, projectId });

  if (!sheet) {
    return NextResponse.json({ error: "Sheet not found." }, { status: 404 });
  }

  try {
    const absPath = planFileAbsolutePath(projectId, sheet.storedFileName);
    await fs.unlink(absPath);
  } catch {
    // file may already be gone
  }

  await sheet.deleteOne();
  return NextResponse.json({ ok: true });
}
