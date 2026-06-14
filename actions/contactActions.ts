"use server";

import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import ContactModel from "@/models/Contact";
import { getContactsByCustomerId, getContactsByVendorId, type SerializedContact } from "@/lib/contacts";

function opt(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function listContactsByOwner(
  ownerType: "customer" | "vendor",
  ownerId: string
): Promise<SerializedContact[]> {
  if (ownerType === "customer") return getContactsByCustomerId(ownerId);
  return getContactsByVendorId(ownerId);
}

export async function createContact(
  ownerType: "customer" | "vendor",
  ownerId: string,
  formData: FormData
): Promise<{ success: true; contact: SerializedContact } | { success: false; error: string }> {
  try {
    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return { success: false, error: "Invalid owner ID." };
    }
    const firstName = opt(formData, "firstName");
    const lastName  = opt(formData, "lastName");
    if (!firstName) return { success: false, error: "First name is required." };
    if (!lastName)  return { success: false, error: "Last name is required." };

    await connectDB();
    const data = {
      prefix:    opt(formData, "prefix"),
      firstName,
      lastName,
      title:     opt(formData, "title"),
      email:     opt(formData, "email"),
      phone:     opt(formData, "phone"),
      customerId: ownerType === "customer" ? new mongoose.Types.ObjectId(ownerId) : null,
      vendorId:   ownerType === "vendor"   ? new mongoose.Types.ObjectId(ownerId) : null,
    };
    const doc = await ContactModel.create(data);

    revalidatePath("/customers");
    revalidatePath("/vendors");
    revalidatePath("/asset-management/list-of-assets");

    const prefix    = data.prefix;
    const first     = data.firstName;
    const last      = data.lastName;
    const contact: SerializedContact = {
      _id:        doc._id.toString(),
      prefix,
      firstName:  first,
      lastName:   last,
      fullName:   [prefix, first, last].filter(Boolean).join(" "),
      title:      data.title,
      email:      data.email,
      phone:      data.phone,
      customerId: data.customerId?.toString() ?? null,
      vendorId:   data.vendorId?.toString()   ?? null,
    };
    return { success: true, contact };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateContact(
  id: string,
  formData: FormData
): Promise<{ success: true; contact: SerializedContact } | { success: false; error: string }> {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) return { success: false, error: "Invalid ID." };
    const firstName = opt(formData, "firstName");
    const lastName  = opt(formData, "lastName");
    if (!firstName) return { success: false, error: "First name is required." };
    if (!lastName)  return { success: false, error: "Last name is required." };

    await connectDB();
    const doc = await ContactModel.findById(id);
    if (!doc) return { success: false, error: "Contact not found." };

    doc.prefix    = opt(formData, "prefix");
    doc.firstName = firstName;
    doc.lastName  = lastName;
    doc.title     = opt(formData, "title");
    doc.email     = opt(formData, "email");
    doc.phone     = opt(formData, "phone");
    await doc.save();

    revalidatePath("/customers");
    revalidatePath("/vendors");
    revalidatePath("/asset-management/list-of-assets");

    const prefix = doc.prefix as string;
    const first  = doc.firstName as string;
    const last   = doc.lastName as string;
    const contact: SerializedContact = {
      _id:        doc._id.toString(),
      prefix,
      firstName:  first,
      lastName:   last,
      fullName:   [prefix, first, last].filter(Boolean).join(" "),
      title:      doc.title as string,
      email:      doc.email as string,
      phone:      doc.phone as string,
      customerId: doc.customerId ? doc.customerId.toString() : null,
      vendorId:   doc.vendorId   ? doc.vendorId.toString()   : null,
    };
    return { success: true, contact };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function deleteContact(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) return { success: false, error: "Invalid ID." };
    await connectDB();
    await ContactModel.findByIdAndDelete(id);
    revalidatePath("/customers");
    revalidatePath("/vendors");
    revalidatePath("/asset-management/list-of-assets");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
