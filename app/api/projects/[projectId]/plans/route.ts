import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import PlanSheet from "@/models/PlanSheet";

type RouteParams = { params: Promise<{ projectId: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { projectId } = await params;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return NextResponse.json({ error: "Invalid project id." }, { status: 400 });
  }

  await connectDB();
  const sheets = await PlanSheet.find({ projectId }).sort({ order: 1 }).lean();

  return NextResponse.json({
    sheets: sheets.map((s) => ({
      _id: (s._id as mongoose.Types.ObjectId).toString(),
      sheetName: s.sheetName,
      pageNumber: s.pageNumber,
      storedFileName: s.storedFileName,
      discipline: s.discipline,
      order: s.order,
      originalFileName: s.originalFileName,
      createdAt: (s.createdAt as Date).toISOString(),
    })),
  });
}
