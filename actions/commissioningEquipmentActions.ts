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

    const parentAssetIdStr = optionalString(formData, "parentAssetId");
    let parentAssetId: mongoose.Types.ObjectId | null = null;
    if (parentAssetIdStr) {
      if (!mongoose.Types.ObjectId.isValid(parentAssetIdStr)) {
        return { success: false as const, error: "Invalid parent asset." };
      }
      parentAssetId = new mongoose.Types.ObjectId(parentAssetIdStr);
    }

    const assetTypeIdStr = optionalString(formData, "assetTypeId");
    const assetTypeId =
      assetTypeIdStr && mongoose.Types.ObjectId.isValid(assetTypeIdStr)
        ? new mongoose.Types.ObjectId(assetTypeIdStr)
        : null;

    const contactPersonIdStr = optionalString(formData, "contactPersonId");
    const contactPersonId =
      contactPersonIdStr && mongoose.Types.ObjectId.isValid(contactPersonIdStr)
        ? new mongoose.Types.ObjectId(contactPersonIdStr)
        : null;

    const doc = await CommissioningEquipment.create({
      projectId: new mongoose.Types.ObjectId(projectIdStr),
      customerId,
      assetTypeId,
      parentAssetId,
      contactPersonId,
      assetName,
      description: optionalString(formData, "description") ?? "",
      assetNumber: optionalString(formData, "assetNumber") ?? "",
      serviceAndPart,
      giai: optionalString(formData, "giai") ?? "",
      orderedDate: optionalDate(formData, "orderedDate"),
      installationDate: optionalDate(formData, "installationDate"),
      purchasedDate: optionalDate(formData, "purchasedDate"),
      warrantyExpiration: optionalDate(formData, "warrantyExpiration"),
      contact: "",
      address: optionalString(formData, "address") ?? "",
    });

    revalidatePath("/commissioning");
    revalidatePath("/asset-management/list-of-assets");
    revalidatePath(`/projects/${projectIdStr}`);
    revalidatePath(`/projects/${projectIdStr}/commissioning`);

    return { success: true as const, id: doc._id.toString() };
  } catch (error: unknown) {
    console.error("createCommissioningEquipment:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false as const, error: message };
  }
}

export async function updateCommissioningEquipment(
  id: string,
  formData: FormData
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { success: false as const, error: "Invalid equipment ID." };
    }

    const assetName = requiredString(formData, "assetName");
    if (!assetName) {
      return { success: false as const, error: "Asset name is required." };
    }

    const serviceAndPart = requiredString(formData, "serviceAndPart");
    if (!serviceAndPart) {
      return { success: false as const, error: "Service and part is required." };
    }

    await connectDB();

    const doc = await CommissioningEquipment.findById(id);
    if (!doc) {
      return { success: false as const, error: "Equipment not found." };
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

    const parentAssetIdStr = optionalString(formData, "parentAssetId");
    let parentAssetId: mongoose.Types.ObjectId | null = null;
    if (parentAssetIdStr) {
      if (!mongoose.Types.ObjectId.isValid(parentAssetIdStr)) {
        return { success: false as const, error: "Invalid parent asset." };
      }
      parentAssetId = new mongoose.Types.ObjectId(parentAssetIdStr);
    }

    const assetTypeIdStr = optionalString(formData, "assetTypeId");
    const assetTypeId =
      assetTypeIdStr && mongoose.Types.ObjectId.isValid(assetTypeIdStr)
        ? new mongoose.Types.ObjectId(assetTypeIdStr)
        : null;

    const contactPersonIdStr = optionalString(formData, "contactPersonId");
    const contactPersonId =
      contactPersonIdStr && mongoose.Types.ObjectId.isValid(contactPersonIdStr)
        ? new mongoose.Types.ObjectId(contactPersonIdStr)
        : null;

    doc.assetName = assetName;
    doc.description = optionalString(formData, "description") ?? "";
    doc.assetNumber = optionalString(formData, "assetNumber") ?? "";
    doc.serviceAndPart = serviceAndPart;
    doc.assetTypeId = assetTypeId;
    doc.parentAssetId = parentAssetId;
    doc.contactPersonId = contactPersonId;
    doc.giai = optionalString(formData, "giai") ?? "";
    doc.orderedDate = optionalDate(formData, "orderedDate");
    doc.installationDate = optionalDate(formData, "installationDate");
    doc.purchasedDate = optionalDate(formData, "purchasedDate");
    doc.warrantyExpiration = optionalDate(formData, "warrantyExpiration");
    doc.address = optionalString(formData, "address") ?? "";
    doc.customerId = customerId;

    await doc.save();

    const projectIdStr = doc.projectId.toString();
    revalidatePath("/commissioning");
    revalidatePath("/asset-management/list-of-assets");
    revalidatePath(`/projects/${projectIdStr}`);
    revalidatePath(`/projects/${projectIdStr}/commissioning`);

    return { success: true as const };
  } catch (error: unknown) {
    console.error("updateCommissioningEquipment:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false as const, error: message };
  }
}
