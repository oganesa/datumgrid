'use server'; // This tells Next.js this code only runs on the server
import { connectDB } from "@/lib/mongodb";
import Project from "@/models/Project";
import { revalidatePath } from "next/cache";

export async function createProject(formData: FormData) {
  await connectDB();

  // Extract values from the form [cite: 532, 533]
  const projectData = {
    name: formData.get('name'),
    number: formData.get('number'),
    description: formData.get('description'),
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate'),
    status: "Active", // Default per your requirement [cite: 87]
  };

  try {
    await Project.create(projectData);
    revalidatePath('/projects'); // Refresh the project list page
    return { success: true };
  } catch (error) {
    console.error("Save Error:", error);
    return { success: false };
  }
}