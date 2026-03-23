import { getProjects } from "@/lib/projects";
import ProjectsTable from "@/components/ProjectsTable";

export default async function Page() {
  const projects = await getProjects();

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Projects</h1>

      {projects.length === 0 ? (
        <p className="text-gray-500">No projects yet.</p>
      ) : (
        <ProjectsTable projects={projects} />
      )}
    </div>
  );
}