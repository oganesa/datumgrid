"use server";

import { mkdir, unlink, writeFile } from "fs/promises";
import mongoose from "mongoose";
import { join } from "path";

import { connectDB } from "@/lib/mongodb";
import Customer from "@/models/Customer";
import Project from "@/models/Project";
import { revalidatePath } from "next/cache";

function optionalString(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (v == null || typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

function optionalDate(formData: FormData, key: string): Date | null {
  const raw = optionalString(formData, key);
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createProject(formData: FormData) {
  try {
    await connectDB();

    let customerId: mongoose.Types.ObjectId | undefined;
    const customerIdStr = optionalString(formData, "customerId");
    if (customerIdStr && mongoose.Types.ObjectId.isValid(customerIdStr)) {
      const cust = await Customer.findById(customerIdStr).select("_id").lean();
      if (cust?._id) customerId = cust._id as mongoose.Types.ObjectId;
    }

    const projectData = {
      name: String(formData.get("name") ?? ""),
      number: String(formData.get("number") ?? ""),
      description: optionalString(formData, "description"),
      startDate: optionalDate(formData, "startDate"),
      endDate: optionalDate(formData, "endDate"),
      status: "Active",
      address1: optionalString(formData, "address1"),
      address2: optionalString(formData, "address2"),
      city: optionalString(formData, "city"),
      state: optionalString(formData, "state"),
      zipCode: optionalString(formData, "zipCode"),
      country: optionalString(formData, "country"),
      ...(customerId ? { customerId } : {}),
    };

    await Project.create(projectData);

    revalidatePath("/");
    revalidatePath("/projects");
    return { success: true };
  } catch (error: any) {
    console.error("Save Error:", error);
    return {
      success: false,
      error: error.message ?? "Unknown error",
    };
  }
}

const COVER_MAX_BYTES = 6 * 1024 * 1024;

function detectImageExt(buffer: Buffer): "jpg" | "png" | "gif" | "webp" | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "png";
  }
  if (buffer.length >= 6) {
    const sig = buffer.toString("ascii", 0, 6);
    if (sig === "GIF87a" || sig === "GIF89a") return "gif";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

export async function updateProject(
  projectId: string,
  formData: FormData
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return { success: false, error: "Invalid project." };
    }

    await connectDB();
    const existing = await Project.findById(projectId).select("coverImageUrl").lean();
    if (!existing) {
      return { success: false, error: "Project not found." };
    }

    let customerId: mongoose.Types.ObjectId | null = null;
    const customerIdStr = optionalString(formData, "customerId");
    if (customerIdStr && mongoose.Types.ObjectId.isValid(customerIdStr)) {
      const cust = await Customer.findById(customerIdStr).select("_id").lean();
      if (cust?._id) customerId = cust._id as mongoose.Types.ObjectId;
    }

    const name = optionalString(formData, "name");
    const number = optionalString(formData, "number");
    if (!name || !number) {
      return { success: false, error: "Project name and number are required." };
    }

    let coverImageUrl: string | null | undefined =
      (existing as { coverImageUrl?: string }).coverImageUrl ?? null;

    const removeCover = formData.get("removeCover") === "1" || formData.get("removeCover") === "on";
    const file = formData.get("coverImage");

    if (removeCover) {
      const prev = coverImageUrl;
      coverImageUrl = null;
      if (prev?.startsWith("/uploads/")) {
        try {
          await unlink(join(process.cwd(), "public", prev.replace(/^\//, "")));
        } catch {
          /* ignore missing file */
        }
      }
    }

    if (file instanceof File && file.size > 0) {
      if (file.size > COVER_MAX_BYTES) {
        return { success: false, error: "Image must be 6 MB or smaller." };
      }
      const buf = Buffer.from(await file.arrayBuffer());
      const ext = detectImageExt(buf);
      if (!ext) {
        return { success: false, error: "Please upload a JPEG, PNG, GIF, or WebP image." };
      }
      const uploadDir = join(process.cwd(), "public", "uploads", "projects", projectId);
      await mkdir(uploadDir, { recursive: true });
      const rel = `/uploads/projects/${projectId}/cover.${ext}`;
      if (coverImageUrl?.startsWith("/uploads/") && coverImageUrl !== rel) {
        try {
          await unlink(join(process.cwd(), "public", coverImageUrl.replace(/^\//, "")));
        } catch {
          /* ignore */
        }
      }
      await writeFile(join(process.cwd(), "public", rel.replace(/^\//, "")), buf);
      coverImageUrl = rel;
    }

    const setFields: Record<string, unknown> = {
      name,
      number,
      description: optionalString(formData, "description"),
      status: optionalString(formData, "status") ?? "Active",
      startDate: optionalDate(formData, "startDate"),
      endDate: optionalDate(formData, "endDate"),
      address1: optionalString(formData, "address1"),
      address2: optionalString(formData, "address2"),
      city: optionalString(formData, "city"),
      state: optionalString(formData, "state"),
      zipCode: optionalString(formData, "zipCode"),
      country: optionalString(formData, "country"),
      customerName: optionalString(formData, "customerName"),
      coverImageUrl,
    };
    if (customerId) {
      setFields.customerId = customerId;
    }

    const updateOps: mongoose.UpdateQuery<Record<string, unknown>> = {
      $set: setFields,
    };
    if (!customerId) {
      updateOps.$unset = { customerId: "" };
    }

    await Project.findByIdAndUpdate(projectId, updateOps);

    revalidatePath("/");
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}`, "layout");

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("updateProject:", error);
    return { success: false, error: message };
  }
}