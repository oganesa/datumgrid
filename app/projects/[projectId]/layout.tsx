import { notFound } from "next/navigation";

import ProjectWorkspaceHeaderBridge from "@/components/ProjectWorkspaceHeaderBridge";
import { ProjectWorkspaceProvider } from "@/components/ProjectWorkspaceContext";
import ProjectWorkspaceTopBar from "@/components/ProjectWorkspaceTopBar";
import { getProjectById } from "@/lib/projects";

export const dynamic = "force-dynamic";

type Props = {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
};

export default async function ProjectWorkspaceLayout({
  children,
  params,
}: Props) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) notFound();

  return (
    <div className="-m-8 min-h-[calc(100vh-4rem)] bg-[#F5F5F5]">
      <ProjectWorkspaceProvider initialProject={project}>
        <ProjectWorkspaceHeaderBridge />
        <ProjectWorkspaceTopBar />
        <div className="p-8">{children}</div>
      </ProjectWorkspaceProvider>
    </div>
  );
}
