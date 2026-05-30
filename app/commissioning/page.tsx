import CommissioningEquipmentClient from "@/components/commissioning/CommissioningEquipmentClient";
import {
  getAllCommissioningEquipment,
} from "@/lib/commissioning-equipment";
import { getCustomers } from "@/lib/customers";
import { getProjects } from "@/lib/projects";
import { auth0, isAuth0Configured } from "@/lib/auth0";

export const dynamic = "force-dynamic";

export default async function CommissioningPage() {
  const session = isAuth0Configured() ? await auth0.getSession() : null;

  if (!session) {
    return (
      <div className="space-y-4 p-6">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="text-gray-600">
          Use your Auth0 account to access DatumGrid.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/auth/login?screen_hint=signup"
            className="inline-flex items-center rounded-md bg-[#0099FF] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#2AAAFF]"
          >
            Sign up
          </a>
          <a
            href="/auth/login"
            className="inline-flex items-center rounded-md border border-[#D5D5D5] bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
          >
            Log in
          </a>
        </div>
      </div>
    );
  }

  const [equipment, projects, customers] = await Promise.all([
    getAllCommissioningEquipment(),
    getProjects(),
    getCustomers(),
  ]);

  const projectsForSelect = projects.map((p) => ({
    _id: p._id,
    name: p.name,
    number: p.number,
  }));

  const customersForSelect = customers.map((c) => ({
    _id: c._id,
    name: c.name,
  }));

  return (
    <div className="p-6">
      <CommissioningEquipmentClient
        equipment={equipment}
        showProjectColumns
        projectsForSelect={projectsForSelect}
        customersForSelect={customersForSelect}
      />
    </div>
  );
}
