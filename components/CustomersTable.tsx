"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { SerializedCustomer } from "@/lib/customers";
import NewCustomerModal from "@/components/NewCustomerModal";

type SortKey = "name" | "city" | "email" | "phone" | "createdAt";

const th =
  "border border-gray-200 bg-gray-100 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 whitespace-nowrap cursor-pointer select-none";
const thPlain =
  "border border-gray-200 bg-gray-100 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 whitespace-nowrap";
const td = "border border-gray-200 px-3 py-2 text-sm text-gray-800 whitespace-nowrap";

function dash(s: string | null | undefined) {
  return s?.trim() ? s : "—";
}

function formatCityStateZip(c: SerializedCustomer) {
  const parts = [c.city, c.state, c.zipCode].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

export default function CustomersTable({
  customers: initial,
}: {
  customers: SerializedCustomer[];
}) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<SerializedCustomer | null>(null);

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

  function openEdit(c: SerializedCustomer) {
    setEditItem(c);
    setModalOpen(true);
  }

  function handleSaved() {
    router.refresh();
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {initial.length} {initial.length === 1 ? "customer" : "customers"}
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-md bg-[#0099FF] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#2AAAFF]"
        >
          + New customer
        </button>
      </div>

      {initial.length === 0 ? (
        <p className="rounded-md border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          No customers yet. Use New customer to add one.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-gray-200 bg-white shadow-sm">
          <table className="w-max min-w-full border-collapse text-left">
            <thead>
              <tr>
                <th className={th} onClick={() => onSort("name")}>
                  Customer <SortIcon col="name" />
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
              {sorted.map((c) => {
                const addr = [c.address1, c.address2].filter(Boolean).join(", ");
                return (
                  <tr
                    key={c._id}
                    className="cursor-pointer hover:bg-gray-50"
                    onDoubleClick={() => openEdit(c)}
                    title="Double-click to edit"
                  >
                    <td className={td}>{c.name}</td>
                    <td className={`${td} max-w-[220px] truncate`} title={addr}>
                      {dash(addr || null)}
                    </td>
                    <td className={td}>{formatCityStateZip(c)}</td>
                    <td className={td}>{dash(c.country)}</td>
                    <td className={td}>{dash(c.phone)}</td>
                    <td className={td}>
                      {c.email ? (
                        <a
                          href={`mailto:${c.email}`}
                          className="text-[#0099FF] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {c.email}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={`${td} max-w-[160px] truncate`}>
                      {c.web ? (
                        <a
                          href={c.web.startsWith("http") ? c.web : `https://${c.web}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0099FF] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {c.web}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={td}>{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className={td}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openEdit(c); }}
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

      <NewCustomerModal
        key={editItem?._id ?? "new"}
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditItem(null); }}
        onSuccess={handleSaved}
        editItem={editItem}
      />
    </>
  );
}
