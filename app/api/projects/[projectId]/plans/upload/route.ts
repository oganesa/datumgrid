import { NextResponse } from "next/server";
import fs from "fs/promises";
import mongoose from "mongoose";
import { PDFDocument } from "pdf-lib";

import { connectDB } from "@/lib/mongodb";
import {
  ensurePlansDir,
  planFileAbsolutePath,
  newPlanFileName,
} from "@/lib/plan-storage";
import PlanSheet from "@/models/PlanSheet";

type RouteParams = { params: Promise<{ projectId: string }> };

export const maxDuration = 120;

export async function POST(req: Request, { params }: RouteParams) {
  const { projectId } = await params;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return NextResponse.json({ error: "Invalid project id." }, { status: 400 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "Only PDF files are supported." },
      { status: 400 }
    );
  }

  if (file.size > 100 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File must be under 100 MB." },
      { status: 400 }
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());

  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(buf);
  } catch {
    return NextResponse.json(
      { error: "Could not parse PDF file." },
      { status: 400 }
    );
  }

  const pageCount = pdfDoc.getPageCount();
  if (pageCount === 0) {
    return NextResponse.json({ error: "PDF has no pages." }, { status: 400 });
  }

  await connectDB();
  await ensurePlansDir(projectId);

  const lastSheet = await PlanSheet.findOne({ projectId })
    .sort({ order: -1 })
    .lean();
  let nextOrder = lastSheet ? (lastSheet as { order: number }).order + 1 : 0;

  const baseName = file.name.replace(/\.pdf$/i, "");
  const sheets = [];

  for (let i = 0; i < pageCount; i++) {
    const singlePage = await PDFDocument.create();
    const [copied] = await singlePage.copyPages(pdfDoc, [i]);
    singlePage.addPage(copied);
    const pageBytes = await singlePage.save();

    const storedFileName = newPlanFileName();
    const absPath = planFileAbsolutePath(projectId, storedFileName);
    await fs.writeFile(absPath, pageBytes);

    const sheetName = pageCount === 1 ? baseName : `${baseName} - ${i + 1}`;

    const sheet = await PlanSheet.create({
      projectId: new mongoose.Types.ObjectId(projectId),
      originalFileName: file.name,
      sheetName,
      pageNumber: i + 1,
      storedFileName,
      discipline: "",
      order: nextOrder++,
    });

    sheets.push({
      _id: sheet._id.toString(),
      sheetName: sheet.sheetName,
      pageNumber: sheet.pageNumber,
      storedFileName: sheet.storedFileName,
      discipline: sheet.discipline,
      order: sheet.order,
      originalFileName: sheet.originalFileName,
      createdAt: sheet.createdAt.toISOString(),
    });
  }

  return NextResponse.json({ sheets }, { status: 201 });
}
