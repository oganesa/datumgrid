import { connectDB } from "@/lib/mongodb";
import Project from "@/models/Project";

export async function getProjects() {
  await connectDB();

  const projects = await Project.find()
    .sort({ createdAt: -1 })
    .lean();

  // ✅ Convert to plain serializable objects
  return projects.map((project: any) => ({
    ...project,
    _id: project._id.toString(),
    startDate: project.startDate
      ? project.startDate.toISOString()
      : null,
    endDate: project.endDate
      ? project.endDate.toISOString()
      : null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt?.toISOString(),
  }));
}