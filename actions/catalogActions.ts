"use server";

import { connectDB } from "@/lib/mongodb";
import CostGroup from "@/models/CostGroup";
import CostItem from "@/models/CostItem";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

function parseMoney(v: FormDataEntryValue | null): number {
  if (v == null || v === "") return 0;
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export async function listCostGroups() {
  await connectDB();
  const groups = await CostGroup.find().sort({ sortOrder: 1, name: 1 }).lean();
  return groups.map((g) => ({
    _id: String(g._id),
    name: g.name,
    description: g.description ?? "",
  }));
}

export async function createCostGroup(formData: FormData) {
  try {
    await connectDB();
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return { success: false, error: "Name is required" };
    await CostGroup.create({
      name,
      description: String(formData.get("description") ?? "").trim(),
    });
    revalidatePath("/catalog");
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function createCostItem(formData: FormData) {
  try {
    await connectDB();
    const groupId = String(formData.get("costGroupId") ?? "").trim();
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return { success: false, error: "Select a cost group" };
    }
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return { success: false, error: "Name is required" };

    await CostItem.create({
      name,
      description: String(formData.get("description") ?? "").trim(),
      uom: String(formData.get("uom") ?? "Each").trim() || "Each",
      unitCost: parseMoney(formData.get("unitCost")),
      unitPrice: parseMoney(formData.get("unitPrice")),
      sku: String(formData.get("sku") ?? "").trim(),
      taxable: formData.get("taxable") === "on",
      costGroup: groupId,
    });
    revalidatePath("/catalog");
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function updateCostItem(formData: FormData) {
  try {
    await connectDB();
    const id = String(formData.get("id") ?? "");
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { success: false, error: "Invalid item" };
    }
    const groupId = String(formData.get("costGroupId") ?? "").trim();
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return { success: false, error: "Select a cost group" };
    }
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return { success: false, error: "Name is required" };

    await CostItem.findByIdAndUpdate(id, {
      name,
      description: String(formData.get("description") ?? "").trim(),
      uom: String(formData.get("uom") ?? "Each").trim() || "Each",
      unitCost: parseMoney(formData.get("unitCost")),
      unitPrice: parseMoney(formData.get("unitPrice")),
      sku: String(formData.get("sku") ?? "").trim(),
      taxable: formData.get("taxable") === "on",
      costGroup: groupId,
    });
    revalidatePath("/catalog");
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { success: false, error: msg };
  }
}
