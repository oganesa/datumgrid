import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

const ROOT = path.join(process.cwd(), "uploads", "equipment-guidance");

export function guidanceDirForEquipment(equipmentId: string): string {
  return path.join(ROOT, equipmentId);
}

export function guidanceFileAbsolutePath(
  equipmentId: string,
  storedFileName: string
): string {
  if (
    storedFileName.includes("..") ||
    storedFileName.includes("/") ||
    storedFileName.includes("\\")
  ) {
    throw new Error("Invalid stored file name.");
  }
  return path.join(guidanceDirForEquipment(equipmentId), storedFileName);
}

export async function ensureGuidanceDir(equipmentId: string): Promise<void> {
  await fs.mkdir(guidanceDirForEquipment(equipmentId), { recursive: true });
}

export function newStoredFileName(originalName: string, mimeType: string): string {
  const extFromName = path.extname(originalName).toLowerCase();
  const safeExt =
    extFromName && extFromName.length <= 12
      ? extFromName
      : mimeToExtension(mimeType);
  return `${randomUUID()}${safeExt}`;
}

function mimeToExtension(mime: string): string {
  const m = mime.toLowerCase();
  if (m === "application/pdf") return ".pdf";
  if (m === "image/jpeg") return ".jpg";
  if (m === "image/png") return ".png";
  if (m === "image/webp") return ".webp";
  if (m === "image/gif") return ".gif";
  return ".bin";
}
