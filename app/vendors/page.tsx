import { auth0, isAuth0Configured } from "@/lib/auth0";
import VendorsTable from "@/components/VendorsTable";
import { getVendors } from "@/lib/vendors";

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
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

  const vendors = await getVendors();

  return (
    <div className="p-6">
      {vendors.length === 0 ? (
        <p className="text-gray-500">No vendors yet. Use + New vendor to add one.</p>
      ) : (
        <VendorsTable vendors={vendors} />
      )}
    </div>
  );
}
