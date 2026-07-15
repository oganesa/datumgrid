import { NextResponse } from "next/server";
import fs from "fs/promises";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import PlanSheet from "@/models/PlanSheet";
import { planFileAbsolutePath } from "@/lib/plan-storage";

type RouteContext = {
  params: Promise<{ projectId: string; sheetId: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  const { projectId, sheetId } = await context.params;

  if (!mongoose.Types.ObjectId.isValid(sheetId)) {
    return NextResponse.json({ error: "Invalid sheet id." }, { status: 400 });
  }

  await connectDB();
  const sheet = await PlanSheet.findOne({ _id: sheetId, projectId }).lean();

  if (!sheet) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const s = sheet as { storedFileName: string; sheetName: string };

  let absPath: string;
  try {
    absPath = planFileAbsolutePath(projectId, s.storedFileName);
  } catch {
    return NextResponse.json({ error: "Invalid file path." }, { status: 400 });
  }

  let buf: Buffer;
  try {
    buf = await fs.readFile(absPath);
  } catch {
    return NextResponse.json(
      { error: "File missing on disk." },
      { status: 404 }
    );
  }

  const safeName = encodeURIComponent(s.sheetName.replace(/["\r\n]/g, "_"));

  return new NextResponse(buf as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename*=UTF-8''${safeName}.pdf`,
    },
  });
}
