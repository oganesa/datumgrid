import { NextResponse } from "next/server";
import fs from "fs/promises";
import mongoose from "mongoose";

import {
  ensureGuidanceDir,
  guidanceFileAbsolutePath,
  newStoredFileName,
} from "@/lib/equipment-guidance-storage";
import CommissioningEquipment from "@/models/CommissioningEquipment";
import {
  GUIDANCE_CATEGORY_VALUES,
  type GuidanceCategory,
} from "@/lib/equipment-guidance-types";
import EquipmentGuidanceFile from "@/models/EquipmentGuidanceFile";
import { connectDB } from "@/lib/mongodb";
import { auth0, isAuth0Configured } from "@/lib/auth0";

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_FILES_PER_REQUEST = 15;

export const maxDuration = 120;

function isGuidanceCategory(s: string): s is GuidanceCategory {
  return (GUIDANCE_CATEGORY_VALUES as readonly string[]).includes(s);
}

export async function POST(req: Request) {
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

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const equipmentId = String(form.get("equipmentId") ?? "").trim();
  if (!mongoose.Types.ObjectId.isValid(equipmentId)) {
    return NextResponse.json({ error: "Invalid equipment id." }, { status: 400 });
  }

  const categoryRaw = String(form.get("category") ?? "").trim();
  if (!isGuidanceCategory(categoryRaw)) {
    return NextResponse.json(
      {
        error: `Invalid category. Use one of: ${GUIDANCE_CATEGORY_VALUES.join(", ")}.`,
      },
      { status: 400 }
    );
  }

  const files = form.getAll("files").filter((v): v is File => v instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files uploaded." }, { status: 400 });
  }
  if (files.length > MAX_FILES_PER_REQUEST) {
    return NextResponse.json(
      { error: `At most ${MAX_FILES_PER_REQUEST} files per request.` },
      { status: 400 }
    );
  }

  await connectDB();
  const equipment = await CommissioningEquipment.findById(equipmentId)
    .select("_id")
    .lean();
  if (!equipment) {
    return NextResponse.json({ error: "Equipment not found." }, { status: 404 });
  }

  await ensureGuidanceDir(equipmentId);

  const created: {
    _id: string;
    category: GuidanceCategory;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: string;
  }[] = [];

  try {
    for (const file of files) {
      if (file.size === 0 || file.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: "Each file must be non-empty and under 25 MB." },
          { status: 400 }
        );
      }
      const mimeType = (file.type || "application/octet-stream").toLowerCase();
      if (!ALLOWED_MIME.has(mimeType)) {
        return NextResponse.json(
          {
            error: `Unsupported type "${mimeType}". Use PDF or JPEG, PNG, WebP, GIF images.`,
          },
          { status: 400 }
        );
      }

      const storedFileName = newStoredFileName(file.name, mimeType);
      const absPath = guidanceFileAbsolutePath(equipmentId, storedFileName);
      const buf = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(absPath, buf);

      const doc = await EquipmentGuidanceFile.create({
        equipmentId: new mongoose.Types.ObjectId(equipmentId),
        category: categoryRaw,
        originalName: file.name.slice(0, 500),
        storedFileName,
        mimeType,
        sizeBytes: buf.length,
      });

      created.push({
        _id: doc._id.toString(),
        category: categoryRaw,
        originalName: doc.originalName,
        mimeType: doc.mimeType,
        sizeBytes: doc.sizeBytes,
        createdAt: doc.createdAt.toISOString(),
      });
    }
  } catch (e: unknown) {
    console.error("guidance/upload:", e);
    const msg = e instanceof Error ? e.message : "Upload failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ files: created });
}
