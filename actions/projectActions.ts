"use server";

import { connectDB } from "@/lib/mongodb";
import Project from "@/models/Project";
import { revalidatePath } from "next/cache";

export async function createProject(formData: FormData) {
  try {
    await connectDB();

    const projectData = {
      name: formData.get("name"),
      number: formData.get("number"),
      description: formData.get("description"),
      startDate: formData.get("startDate") || null,
      endDate: formData.get("endDate") || null,
      status: "Active",
    };

    await Project.create(projectData);

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