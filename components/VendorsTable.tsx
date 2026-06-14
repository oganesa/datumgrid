"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { SerializedVendor } from "@/lib/vendors";
import NewVendorModal from "@/components/NewVendorModal";

type SortKey = "name" | "city" | "email" | "phone" | "createdAt";

const th =
  "border border-gray-200 bg-gray-100 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 whitespace-nowrap cursor-pointer select-none";
const thPlain =
  "border border-gray-200 bg-gray-100 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 whitespace-nowrap";
const td = "border border-gray-200 px-3 py-2 text-sm text-gray-800 whitespace-nowrap";

function dash(s: string | null | undefined) {
  return s?.trim() ? s : "—";
}

function formatCityStateZip(v: SerializedVendor) {
  const parts = [v.city, v.state, v.zipCode].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

export default function VendorsTable({ vendors: initial }: { vendors: SerializedVendor[] }) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<SerializedVendor | null>(null);

  function onSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = [...initial].sort((a, b) => {
    const av = a[sortKey] ?? "";
    const bv = b[sortKey] ?? "";
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  function SortIcon({ col }: { col: SortKey }) {
    if (col !== sortKey) return <span className="ml-1 text-gray-400">⇅</span>;
    return <span className="ml-1">{sortDir === "asc" ? "▲" : "▼"}</span>;
  }

  function openCreate() {
    setEditItem(null);
    setModalOpen(true);
  }

  function openEdit(v: SerializedVendor) {
    setEditItem(v);
    setModalOpen(true);
  }

  function handleSaved() {
    router.refresh();
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {initial.length} {initial.length === 1 ? "vendor" : "vendors"}
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-md bg-[#0099FF] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#2AAAFF]"
        >
          + New vendor
        </button>
      </div>

      {initial.length === 0 ? (
        <p className="rounded-md border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          No vendors yet. Use New vendor to add one.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-gray-200 bg-white shadow-sm">
          <table className="w-max min-w-full border-collapse text-left">
            <thead>
              <tr>
                <th className={th} onClick={() => onSort("name")}>
                  Vendor <SortIcon col="name" />
                </th>
                <th className={thPlain}>Address</th>
                <th className={th} onClick={() => onSort("city")}>
                  City / State / ZIP <SortIcon col="city" />
                </th>
                <th className={thPlain}>Country</th>
                <th className={th} onClick={() => onSort("phone")}>
                  Phone <SortIcon col="phone" />
                </th>
                <th className={th} onClick={() => onSort("email")}>
                  Email <SortIcon col="email" />
                </th>
                <th className={thPlain}>Web</th>
                <th className={th} onClick={() => onSort("createdAt")}>
                  Created <SortIcon col="createdAt" />
                </th>
                <th className={thPlain}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((v) => {
                const addr = [v.address1, v.address2].filter(Boolean).join(", ");
                return (
                  <tr
                    key={v._id}
                    className="cursor-pointer hover:bg-gray-50"
                    onDoubleClick={() => openEdit(v)}
                    title="Double-click to edit"
                  >
                    <td className={td}>{v.name}</td>
                    <td className={`${td} max-w-[220px] truncate`} title={addr}>
                      {dash(addr || null)}
                    </td>
                    <td className={td}>{formatCityStateZip(v)}</td>
                    <td className={td}>{dash(v.country)}</td>
                    <td className={td}>{dash(v.phone)}</td>
                    <td className={td}>
                      {v.email ? (
                        <a
                          href={`mailto:${v.email}`}
                          className="text-[#0099FF] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {v.email}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={`${td} max-w-[160px] truncate`}>
                      {v.web ? (
                        <a
                          href={v.web.startsWith("http") ? v.web : `https://${v.web}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0099FF] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {v.web}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={td}>{new Date(v.createdAt).toLocaleDateString()}</td>
                    <td className={td}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openEdit(v); }}
                        className="text-xs text-[#0099FF] hover:underline"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <NewVendorModal
        key={editItem?._id ?? "new"}
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditItem(null); }}
        onSuccess={handleSaved}
        editItem={editItem}
      />
    </>
  );
}
