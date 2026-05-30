"use server";

import { revalidatePath } from "next/cache";

import { connectDB } from "@/lib/mongodb";
import Vendor from "@/models/Vendor";

function optionalString(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (v == null || typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

export async function createVendor(formData: FormData): Promise<
  { success: true; id: string } | { success: false; error: string }
> {
  try {
    await connectDB();

    const name = optionalString(formData, "name");
    if (!name) {
      return { success: false as const, error: "Vendor name is required." };
    }

    const doc = await Vendor.create({
      name,
      address1: optionalString(formData, "address1"),
      address2: optionalString(formData, "address2"),
      city: optionalString(formData, "city"),
      state: optionalString(formData, "state"),
      zipCode: optionalString(formData, "zipCode"),
      country: optionalString(formData, "country"),
      phone: optionalString(formData, "phone"),
      email: optionalString(formData, "email"),
      web: optionalString(formData, "web"),
    });

    revalidatePath("/");
    revalidatePath("/vendors");
    return { success: true as const, id: doc._id.toString() };
  } catch (error: unknown) {
    console.error("createVendor:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false as const, error: message };
  }
}
