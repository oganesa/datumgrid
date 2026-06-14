import { NextResponse } from "next/server";
import fs from "fs/promises";
import mongoose from "mongoose";

import { guidanceFileAbsolutePath } from "@/lib/equipment-guidance-storage";
import EquipmentGuidanceFile from "@/models/EquipmentGuidanceFile";
import { connectDB } from "@/lib/mongodb";
import { auth0, isAuth0Configured } from "@/lib/auth0";

type RouteContext = { params: Promise<{ fileId: string }> };

export async function GET(_req: Request, context: RouteContext) {
  if (!isAuth0Configured()) {
    return NextResponse.json(
      { error: "Authentication is not configured." },
      { status: 503 }
    );
  }

  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fileId } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(fileId)) {
    return NextResponse.json({ error: "Invalid file id." }, { status: 400 });
  }

  await connectDB();
  const doc = await EquipmentGuidanceFile.findById(fileId).lean();
  if (!doc) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const d = doc as {
    equipmentId: mongoose.Types.ObjectId;
    storedFileName: string;
    originalName: string;
    mimeType: string;
  };

  const equipmentId = d.equipmentId.toString();
  let absPath: string;
  try {
    absPath = guidanceFileAbsolutePath(equipmentId, d.storedFileName);
  } catch {
    return NextResponse.json({ error: "Invalid file path." }, { status: 400 });
  }

  let buf: Buffer;
  try {
    buf = await fs.readFile(absPath);
  } catch {
    return NextResponse.json({ error: "File missing on disk." }, { status: 404 });
  }

  const safeName = encodeURIComponent(d.originalName.replace(/["\r\n]/g, "_"));

  return new NextResponse(buf as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": d.mimeType,
      "Content-Disposition": `attachment; filename*=UTF-8''${safeName}`,
    },
  });
}

export async function DELETE(_req: Request, context: RouteContext) {
  if (!isAuth0Configured()) {
    return NextResponse.json(
      { error: "Authentication is not configured." },
      { status: 503 }
    );
  }

  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fileId } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(fileId)) {
    return NextResponse.json({ error: "Invalid file id." }, { status: 400 });
  }

  await connectDB();
  const doc = await EquipmentGuidanceFile.findById(fileId);
  if (!doc) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const equipmentId = doc.equipmentId.toString();
  let absPath: string;
  try {
    absPath = guidanceFileAbsolutePath(equipmentId, doc.storedFileName);
  } catch {
    return NextResponse.json({ error: "Invalid file path." }, { status: 400 });
  }

  try {
    await fs.unlink(absPath);
  } catch {
    /* file may already be gone */
  }

  await doc.deleteOne();
  return NextResponse.json({ ok: true });
}
