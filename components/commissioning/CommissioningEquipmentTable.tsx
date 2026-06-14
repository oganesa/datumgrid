import type { SerializedCommissioningEquipment } from "@/lib/commissioning-equipment";
import type { ColumnKey } from "@/lib/commissioning-view-types";

import { formatTableDate } from "./format";

function dash(s: string | null | undefined) {
  return s?.trim() ? s : "—";
}

const th =
  "border border-gray-200 bg-gray-100 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 whitespace-nowrap";
const td =
  "border border-gray-200 px-3 py-2 text-sm text-gray-800 whitespace-nowrap max-w-[14rem] truncate";

type ColDef = {
  key: ColumnKey;
  label: string;
  render: (r: SerializedCommissioningEquipment) => React.ReactNode;
};

const COLUMN_DEFS: ColDef[] = [
  { key: "projectNumber",     label: "Project Number",      render: (r) => dash(r.projectNumber) },
  { key: "projectName",       label: "Project Name",        render: (r) => dash(r.projectName) },
  { key: "description",       label: "Description",         render: (r) => dash(r.description) },
  { key: "assetNumber",       label: "Asset Number",        render: (r) => dash(r.assetNumber) },
  { key: "assetTypeName",     label: "Asset Type",          render: (r) => r.assetTypeCode && r.assetTypeName ? `${r.assetTypeCode} — ${r.assetTypeName}` : dash(r.assetTypeName) },
  { key: "serviceAndPart",    label: "Service and Part",    render: (r) => r.serviceAndPart },
  { key: "parentAssetName",   label: "Parent Asset",        render: (r) => dash(r.parentAssetName) },
  { key: "giai",              label: "GIAI",                render: (r) => dash(r.giai) },
  { key: "orderedDate",       label: "Ordered Date",        render: (r) => formatTableDate(r.orderedDate) },
  { key: "installationDate",  label: "Installation Date",   render: (r) => formatTableDate(r.installationDate) },
  { key: "purchasedDate",     label: "Purchased Date",      render: (r) => formatTableDate(r.purchasedDate) },
  { key: "warrantyExpiration",label: "Warranty Expiration", render: (r) => formatTableDate(r.warrantyExpiration) },
  { key: "customerName",      label: "Customer",            render: (r) => dash(r.customerName) },
  { key: "contact",           label: "Contact",             render: (r) => r.contact },
  { key: "address",           label: "Address",             render: (r) => dash(r.address) },
];

type Props = {
  rows: SerializedCommissioningEquipment[];
  /**
   * True on the global commissioning page (project columns available).
   * False on a project-specific page (project columns always hidden).
   */
  showProjectColumns: boolean;
  /** null = show all applicable columns; array = show only listed keys in that order */
  visibleColumns: ColumnKey[] | null;
  onRowOpen?: (row: SerializedCommissioningEquipment) => void;
};

export default function CommissioningEquipmentTable({
  rows,
  showProjectColumns,
  visibleColumns,
  onRowOpen,
}: Props) {
  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
        No equipment yet. Use Create equipment to add a row.
      </p>
    );
  }

  const activeCols = visibleColumns
    ? visibleColumns
        .filter((k) => showProjectColumns || (k !== "projectNumber" && k !== "projectName"))
        .map((k) => COLUMN_DEFS.find((c) => c.key === k))
        .filter((c): c is ColDef => c !== undefined)
    : COLUMN_DEFS.filter(
        (c) => showProjectColumns || (c.key !== "projectNumber" && c.key !== "projectName")
      );

  return (
    <div className="overflow-x-auto rounded-md border border-gray-200 bg-white shadow-sm">
      <table className="w-max min-w-full border-collapse text-left">
        <thead>
          <tr>
            <th className={th}>Asset name</th>
            {activeCols.map((c) => (
              <th key={c.key} className={th}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r._id}
              className={`hover:bg-gray-50 ${onRowOpen ? "cursor-pointer select-none" : ""}`}
              onDoubleClick={() => onRowOpen?.(r)}
              title={onRowOpen ? "Double-click to open record" : undefined}
            >
              <td className={`${td} font-medium`} title={r.assetName}>
                {r.assetName}
              </td>
              {activeCols.map((c) => {
                const content = c.render(r);
                return (
                  <td
                    key={c.key}
                    className={td}
                    title={typeof content === "string" ? content : undefined}
                  >
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
