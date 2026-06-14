import { notFound } from "next/navigation";

import ProjectTabContent from "@/components/ProjectTabContent";
import { getCommissioningEquipmentByProjectId } from "@/lib/commissioning-equipment";
import { getCustomers } from "@/lib/customers";
import { getAllContacts } from "@/lib/contacts";
import { getProjectById } from "@/lib/projects";
import { parseProjectSection } from "@/lib/project-workspace";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ projectId: string; section?: string[] }>;
};

export default async function ProjectWorkspacePage({ params }: Props) {
  const { projectId, section } = await params;
  const tab = parseProjectSection(section);
  if (tab === null) notFound();

  const project = await getProjectById(projectId);
  if (!project) notFound();

  let commissioningEquipment:
    | Awaited<ReturnType<typeof getCommissioningEquipmentByProjectId>>
    | undefined;
  let commissioningCustomers:
    | { _id: string; name: string }[]
    | undefined;
  let commissioningContacts:
    | Awaited<ReturnType<typeof getAllContacts>>
    | undefined;

  if (tab === "commissioning") {
    const [equipment, customers, contacts] = await Promise.all([
      getCommissioningEquipmentByProjectId(projectId),
      getCustomers(),
      getAllContacts(),
    ]);
    commissioningEquipment = equipment;
    commissioningCustomers = customers.map((c) => ({
      _id: c._id,
      name: c.name,
    }));
    commissioningContacts = contacts;
  }

  return (
    <ProjectTabContent
      tab={tab}
      project={project}
      commissioningEquipment={commissioningEquipment}
      commissioningCustomers={commissioningCustomers}
      commissioningContacts={commissioningContacts}
    />
  );
}
