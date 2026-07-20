import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import PlanSheet from "@/models/PlanSheet";
import { downloadPlanFile, StorageConfigError } from "@/lib/storage-provider";

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

  const s = sheet as {
    storedFileName?: string;
    storageProvider?: string;
    storageFileId?: string;
    sheetName: string;
  };

  let buf: Buffer;
  try {
    buf = await downloadPlanFile(projectId, s);
  } catch (error) {
    if (error instanceof StorageConfigError) {
      return NextResponse.json({ code: error.code, error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: s.storageProvider === "google-drive" ? "File missing in Google Drive." : "File missing on disk." },
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
