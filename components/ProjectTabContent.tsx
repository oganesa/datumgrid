import CommissioningEquipmentClient from "@/components/commissioning/CommissioningEquipmentClient";
import ProjectDashboard from "@/components/ProjectDashboard";
import type { SerializedCommissioningEquipment } from "@/lib/commissioning-equipment";
import type { SerializedContact } from "@/lib/contacts";
import type { SerializedProject } from "@/lib/projects";
import type { ProjectWorkspaceTab } from "@/lib/project-workspace";
import { PROJECT_TAB_ORDER } from "@/lib/project-workspace";

function tabLabel(tab: ProjectWorkspaceTab): string {
  return PROJECT_TAB_ORDER.find((t) => t.slug === tab)?.label ?? tab;
}

type CustomerOption = { _id: string; name: string };

type Props = {
  tab: ProjectWorkspaceTab;
  project: SerializedProject;
  commissioningEquipment?: SerializedCommissioningEquipment[];
  commissioningCustomers?: CustomerOption[];
  commissioningContacts?: SerializedContact[];
};

export default function ProjectTabContent({
  tab,
  project,
  commissioningEquipment,
  commissioningCustomers,
  commissioningContacts,
}: Props) {
  if (tab === "dashboard") {
    return <ProjectDashboard />;
  }

  if (tab === "commissioning") {
    return (
      <CommissioningEquipmentClient
        equipment={commissioningEquipment ?? []}
        showProjectColumns={false}
        contextProjectId={project._id}
        customersForSelect={commissioningCustomers ?? []}
        contactsForSelect={commissioningContacts ?? []}
      />
    );
  }

  return (
    <div className="rounded-md border border-dashed border-[#E5EAF2] bg-white p-12 text-center">
      <p className="text-lg font-medium text-gray-800">{tabLabel(tab)}</p>
      <p className="mt-2 text-sm text-gray-500">
        This section is not implemented yet. Content for {tabLabel(tab)} will
        appear here.
      </p>
    </div>
  );
}
