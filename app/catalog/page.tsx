import CatalogView from "@/components/catalog/CatalogView";
import { getCatalogGrouped } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const groups = await getCatalogGrouped();

  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-sm text-gray-500">
          Catalog of works, grouped by cost group. Use the header to add groups and line items.
        </p>
      </div>
      <CatalogView groups={groups} />
    </div>
  );
}
