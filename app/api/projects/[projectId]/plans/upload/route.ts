import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { PDFDocument } from "pdf-lib";

import { connectDB } from "@/lib/mongodb";
import { getOrCreatePlansFolderId, StorageConfigError, uploadPlanFile } from "@/lib/storage-provider";
import PlanSheet from "@/models/PlanSheet";
import Project from "@/models/Project";

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

  const project = await Project.findById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  let plansFolderId: string;
  try {
    plansFolderId = await getOrCreatePlansFolderId(project);
  } catch (error) {
    if (error instanceof StorageConfigError) {
      const status = error.code === "DRIVE_NOT_CONNECTED" ? 401 : 422;
      return NextResponse.json({ code: error.code, error: error.message }, { status });
    }
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { code: "DRIVE_UPLOAD_FAILED", error: "Google Drive upload failed.", message },
      { status: 502 }
    );
  }

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
    const pageBytes = Buffer.from(await singlePage.save());

    const sheetName = pageCount === 1 ? baseName : `${baseName} - ${i + 1}`;

    let uploaded;
    try {
      uploaded = await uploadPlanFile(project, plansFolderId, `${sheetName}.pdf`, pageBytes);
    } catch (error) {
      if (error instanceof StorageConfigError) {
        const status = error.code === "DRIVE_NOT_CONNECTED" ? 401 : 422;
        return NextResponse.json(
          { code: error.code, error: error.message, sheets },
          { status }
        );
      }
      const message = error instanceof Error ? error.message : String(error);
      return NextResponse.json(
        { code: "DRIVE_UPLOAD_FAILED", error: "Google Drive upload failed.", message, sheets },
        { status: 502 }
      );
    }

    const sheet = await PlanSheet.create({
      projectId: new mongoose.Types.ObjectId(projectId),
      originalFileName: file.name,
      sheetName,
      pageNumber: i + 1,
      storageProvider: uploaded.storageProvider,
      storageFileId: uploaded.storageFileId,
      storageFileUrl: uploaded.storageFileUrl,
      discipline: "",
      order: nextOrder++,
    });

    sheets.push({
      _id: sheet._id.toString(),
      sheetName: sheet.sheetName,
      pageNumber: sheet.pageNumber,
      storageProvider: sheet.storageProvider,
      storageFileUrl: sheet.storageFileUrl,
      discipline: sheet.discipline,
      order: sheet.order,
      originalFileName: sheet.originalFileName,
      createdAt: sheet.createdAt.toISOString(),
    });
  }

  return NextResponse.json({ sheets }, { status: 201 });
}
