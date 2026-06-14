"use server";

import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import AssetType from "@/models/AssetType";

function parseCode(formData: FormData): string | null {
  const raw = (formData.get("typeCode") as string)?.trim();
  if (!raw) return null;
  // Pad to 3 digits if user typed "1" or "12"
  const padded = raw.padStart(3, "0");
  if (!/^[0-9]{3}$/.test(padded)) return null;
  if (parseInt(padded, 10) < 1 || parseInt(padded, 10) > 999) return null;
  return padded;
}

export async function createAssetType(
  formData: FormData
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    const typeCode = parseCode(formData);
    if (!typeCode)
      return { success: false, error: "Type code must be a number between 001 and 999." };

    const typeName = (formData.get("typeName") as string)?.trim();
    if (!typeName) return { success: false, error: "Type name is required." };

    await connectDB();

    const existing = await AssetType.findOne({ typeCode }).lean();
    if (existing) return { success: false, error: `Type code ${typeCode} already exists.` };

    const doc = await AssetType.create({ typeCode, typeName });
    revalidatePath("/asset-management/asset-type");
    return { success: true, id: doc._id.toString() };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function updateAssetType(
  id: string,
  formData: FormData
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!mongoose.Types.ObjectId.isValid(id))
      return { success: false, error: "Invalid ID." };

    const typeCode = parseCode(formData);
    if (!typeCode)
      return { success: false, error: "Type code must be a number between 001 and 999." };

    const typeName = (formData.get("typeName") as string)?.trim();
    if (!typeName) return { success: false, error: "Type name is required." };

    await connectDB();

    const conflict = await AssetType.findOne({ typeCode, _id: { $ne: id } }).lean();
    if (conflict) return { success: false, error: `Type code ${typeCode} already exists.` };

    await AssetType.findByIdAndUpdate(id, { typeCode, typeName });
    revalidatePath("/asset-management/asset-type");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function deleteAssetType(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!mongoose.Types.ObjectId.isValid(id))
      return { success: false, error: "Invalid ID." };

    await connectDB();
    await AssetType.findByIdAndDelete(id);
    revalidatePath("/asset-management/asset-type");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
