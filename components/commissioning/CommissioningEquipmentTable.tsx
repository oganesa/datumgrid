import type { SerializedCommissioningEquipment } from "@/lib/commissioning-equipment";

import { formatTableDate } from "./format";

function dash(s: string | null | undefined) {
  return s?.trim() ? s : "—";
}

const th =
  "border border-gray-200 bg-gray-100 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 whitespace-nowrap";
const td = "border border-gray-200 px-3 py-2 text-sm text-gray-800 whitespace-nowrap max-w-[14rem] truncate";

type Props = {
  rows: SerializedCommissioningEquipment[];
  showProjectColumns: boolean;
  onRowOpen?: (row: SerializedCommissioningEquipment) => void;
};

export default function CommissioningEquipmentTable({
  rows,
  showProjectColumns,
  onRowOpen,
}: Props) {
  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
        No equipment yet. Use Create equipment to add a row.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-gray-200 bg-white shadow-sm">
      <table className="w-max min-w-full border-collapse text-left">
        <thead>
          <tr>
            {showProjectColumns ? (
              <>
                <th className={th}>Project number</th>
                <th className={th}>Project name</th>
              </>
            ) : null}
            <th className={th}>Asset name</th>
            <th className={`${th} max-w-[12rem]`}>Description</th>
            <th className={th}>Asset number</th>
            <th className={th}>Service and part</th>
            <th className={th}>Parent asset</th>
            <th className={th}>GIAI</th>
            <th className={th}>Ordered date</th>
            <th className={th}>Installation date</th>
            <th className={th}>Purchased date</th>
            <th className={th}>Warranty expiration</th>
            <th className={th}>Customer</th>
            <th className={th}>Contact</th>
            <th className={th}>Address</th>
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
              {showProjectColumns ? (
                <>
                  <td className={td} title={dash(r.projectNumber)}>
                    {dash(r.projectNumber)}
                  </td>
                  <td className={td} title={dash(r.projectName)}>
                    {dash(r.projectName)}
                  </td>
                </>
              ) : null}
              <td className={`${td} font-medium`} title={r.assetName}>
                {r.assetName}
              </td>
              <td className={td} title={dash(r.description)}>
                {dash(r.description)}
              </td>
              <td className={td} title={dash(r.assetNumber)}>
                {dash(r.assetNumber)}
              </td>
              <td className={td} title={r.serviceAndPart}>
                {r.serviceAndPart}
              </td>
              <td className={td} title={dash(r.parentAsset)}>
                {dash(r.parentAsset)}
              </td>
              <td className={td} title={dash(r.giai)}>
                {dash(r.giai)}
              </td>
              <td className={td}>{formatTableDate(r.orderedDate)}</td>
              <td className={td}>{formatTableDate(r.installationDate)}</td>
              <td className={td}>{formatTableDate(r.purchasedDate)}</td>
              <td className={td}>{formatTableDate(r.warrantyExpiration)}</td>
              <td className={td} title={dash(r.customerName)}>
                {dash(r.customerName)}
              </td>
              <td className={td} title={r.contact}>
                {r.contact}
              </td>
              <td className={td} title={dash(r.address)}>
                {dash(r.address)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
