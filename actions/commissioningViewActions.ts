"use server";

import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

import { auth0, isAuth0Configured } from "@/lib/auth0";
import { connectDB } from "@/lib/mongodb";
import CommissioningView from "@/models/CommissioningView";
import type { ColumnKey, FilterField, FilterOperator } from "@/lib/commissioning-view-types";

async function getUserId(): Promise<string | null> {
  if (!isAuth0Configured()) return null;
  const session = await auth0.getSession();
  return session?.user?.sub ?? null;
}

export async function createCommissioningView(formData: FormData): Promise<
  { success: true; id: string } | { success: false; error: string }
> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    const name = (formData.get("name") as string)?.trim();
    if (!name) return { success: false, error: "View name is required." };

    const description = (formData.get("description") as string)?.trim() ?? "";

    const filterField = formData.get("filterField") as FilterField | "";
    const filterOperator = formData.get("filterOperator") as FilterOperator | "";
    const filterValue = (formData.get("filterValue") as string)?.trim() ?? "";

    const filters =
      filterField && filterOperator && filterValue
        ? [{ field: filterField, operator: filterOperator, value: filterValue }]
        : [];

    const columnsRaw = formData.get("columns") as string | null;
    const columns: ColumnKey[] = columnsRaw
      ? (JSON.parse(columnsRaw) as ColumnKey[])
      : [];

    await connectDB();
    const doc = await CommissioningView.create({
      userId,
      name,
      description,
      filters,
      columns,
    });

    revalidatePath("/commissioning");
    revalidatePath("/asset-management/list-of-assets");
    return { success: true, id: doc._id.toString() };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function updateCommissioningView(
  id: string,
  formData: FormData
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    if (!mongoose.Types.ObjectId.isValid(id))
      return { success: false, error: "Invalid view ID." };

    const name = (formData.get("name") as string)?.trim();
    if (!name) return { success: false, error: "View name is required." };

    const description = (formData.get("description") as string)?.trim() ?? "";

    const filterField = formData.get("filterField") as FilterField | "";
    const filterOperator = formData.get("filterOperator") as FilterOperator | "";
    const filterValue = (formData.get("filterValue") as string)?.trim() ?? "";

    const filters =
      filterField && filterOperator && filterValue
        ? [{ field: filterField, operator: filterOperator, value: filterValue }]
        : [];

    const columnsRaw = formData.get("columns") as string | null;
    const columns: ColumnKey[] = columnsRaw
      ? (JSON.parse(columnsRaw) as ColumnKey[])
      : [];

    await connectDB();
    const doc = await CommissioningView.findOne({ _id: id, userId });
    if (!doc) return { success: false, error: "View not found." };

    doc.set({ name, description, filters, columns });
    await doc.save();

    revalidatePath("/commissioning");
    revalidatePath("/asset-management/list-of-assets");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function deleteCommissioningView(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    if (!mongoose.Types.ObjectId.isValid(id))
      return { success: false, error: "Invalid view ID." };

    await connectDB();
    await CommissioningView.deleteOne({ _id: id, userId });

    revalidatePath("/commissioning");
    revalidatePath("/asset-management/list-of-assets");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
