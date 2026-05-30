"use server";

import { revalidatePath } from "next/cache";

import { connectDB } from "@/lib/mongodb";
import AppSettings from "@/models/AppSettings";

const FIELDS = [
  "tasksEnabled",
  "budgetsEnabled",
  "risksIssueLogEnabled",
  "changeManagementEnabled",
  "rfiEnabled",
  "submittalsEnabled",
  "punchListEnabled",
] as const;

export type ModuleToggleField = (typeof FIELDS)[number];

export async function setModuleToggle(
  field: ModuleToggleField,
  enabled: boolean
): Promise<{ success: true } | { success: false; error: string }> {
  if (!FIELDS.includes(field)) {
    return { success: false as const, error: "Invalid setting." };
  }
  try {
    await connectDB();
    await AppSettings.findOneAndUpdate(
      {},
      { $set: { [field]: enabled } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    revalidatePath("/");
    revalidatePath("/settings");
    revalidatePath("/tasks");
    revalidatePath("/budgets");
    revalidatePath("/risks-issue-log");
    revalidatePath("/change-management");
    revalidatePath("/rfi");
    revalidatePath("/submittals");
    revalidatePath("/punch-list");

    return { success: true as const };
  } catch (e: unknown) {
    console.error("setModuleToggle:", e);
    const msg = e instanceof Error ? e.message : "Could not save.";
    return { success: false as const, error: msg };
  }
}
