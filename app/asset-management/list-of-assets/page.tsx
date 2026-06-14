import CommissioningEquipmentClient from "@/components/commissioning/CommissioningEquipmentClient";
import { getAllCommissioningEquipment } from "@/lib/commissioning-equipment";
import { getCommissioningViews } from "@/lib/commissioning-views";
import { getAllAssetTypes } from "@/lib/asset-types";
import { getCustomers } from "@/lib/customers";
import { getProjects } from "@/lib/projects";
import { getAllContacts } from "@/lib/contacts";
import { auth0, isAuth0Configured } from "@/lib/auth0";

export const dynamic = "force-dynamic";

export default async function ListOfAssetsPage() {
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
            className="inline-flex items-center rounded-md bg-[#4A90E2] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#7FB3FF]"
          >
            Sign up
          </a>
          <a
            href="/auth/login"
            className="inline-flex items-center rounded-md border border-[#E5EAF2] bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
          >
            Log in
          </a>
        </div>
      </div>
    );
  }

  const [equipment, projects, customers, assetTypes, views, contacts] = await Promise.all([
    getAllCommissioningEquipment(),
    getProjects(),
    getCustomers(),
    getAllAssetTypes(),
    getCommissioningViews(session.user.sub),
    getAllContacts(),
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
        assetTypesForSelect={assetTypes}
        contactsForSelect={contacts}
        initialViews={views}
      />
    </div>
  );
}
