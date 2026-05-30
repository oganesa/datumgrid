"use server";

import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import CommissioningEquipment from "@/models/CommissioningEquipment";
import Customer from "@/models/Customer";
import Project from "@/models/Project";

function optionalString(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (v == null || typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

function requiredString(formData: FormData, key: string): string | null {
  return optionalString(formData, key);
}

function optionalDate(formData: FormData, key: string): Date | null {
  const v = formData.get(key);
  if (v == null || typeof v !== "string") return null;
  const t = v.trim();
  if (t === "") return null;
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createCommissioningEquipment(
  formData: FormData
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    const projectIdStr = requiredString(formData, "projectId");
    if (!projectIdStr || !mongoose.Types.ObjectId.isValid(projectIdStr)) {
      return { success: false as const, error: "A valid project is required." };
    }

    const assetName = requiredString(formData, "assetName");
    if (!assetName) {
      return { success: false as const, error: "Asset name is required." };
    }

    const serviceAndPart = requiredString(formData, "serviceAndPart");
    if (!serviceAndPart) {
      return {
        success: false as const,
        error: "Service and part is required.",
      };
    }

    const contact = requiredString(formData, "contact");
    if (!contact) {
      return { success: false as const, error: "Contact is required." };
    }

    await connectDB();
    const project = await Project.findById(projectIdStr).select("_id").lean();
    if (!project) {
      return { success: false as const, error: "Project not found." };
    }

    const customerIdStr = optionalString(formData, "customerId");
    let customerId: mongoose.Types.ObjectId | null = null;
    if (customerIdStr) {
      if (!mongoose.Types.ObjectId.isValid(customerIdStr)) {
        return { success: false as const, error: "Invalid customer." };
      }
      const cust = await Customer.findById(customerIdStr).select("_id").lean();
      if (!cust) {
        return { success: false as const, error: "Customer not found." };
      }
      customerId = new mongoose.Types.ObjectId(customerIdStr);
    }

    const doc = await CommissioningEquipment.create({
      projectId: new mongoose.Types.ObjectId(projectIdStr),
      customerId,
      assetName,
      description: optionalString(formData, "description") ?? "",
      assetNumber: optionalString(formData, "assetNumber") ?? "",
      serviceAndPart,
      parentAsset: optionalString(formData, "parentAsset") ?? "",
      giai: optionalString(formData, "giai") ?? "",
      orderedDate: optionalDate(formData, "orderedDate"),
      installationDate: optionalDate(formData, "installationDate"),
      purchasedDate: optionalDate(formData, "purchasedDate"),
      warrantyExpiration: optionalDate(formData, "warrantyExpiration"),
      contact,
      address: optionalString(formData, "address") ?? "",
    });

    revalidatePath("/commissioning");
    revalidatePath(`/projects/${projectIdStr}`);
    revalidatePath(`/projects/${projectIdStr}/commissioning`);

    return { success: true as const, id: doc._id.toString() };
  } catch (error: unknown) {
    console.error("createCommissioningEquipment:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false as const, error: message };
  }
}
