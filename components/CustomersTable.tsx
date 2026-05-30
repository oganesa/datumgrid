"use client";

import { useState } from "react";

import type { SerializedCustomer } from "@/lib/customers";

type SortKey = "name" | "city" | "email" | "phone" | "createdAt";

function dash(s: string | null | undefined) {
  return s?.trim() ? s : "—";
}

function formatCityStateZip(c: SerializedCustomer) {
  const parts = [c.city, c.state, c.zipCode].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

export default function CustomersTable({
  customers,
}: {
  customers: SerializedCustomer[];
}) {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function onSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = [...customers].sort((a, b) => {
    const aVal = a[sortKey] ?? "";
    const bVal = b[sortKey] ?? "";
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  function SortIcon({ column }: { column: SortKey }) {
    if (column !== sortKey) return <span className="ml-1 text-gray-300">⇅</span>;
    return sortDir === "asc" ? (
      <span className="ml-1">▲</span>
    ) : (
      <span className="ml-1">▼</span>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border bg-white shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th
              className="cursor-pointer border px-4 py-3 text-left"
              onClick={() => onSort("name")}
            >
              Customer
              <SortIcon column="name" />
            </th>
            <th className="border px-4 py-3 text-left">Address</th>
            <th
              className="cursor-pointer border px-4 py-3 text-left"
              onClick={() => onSort("city")}
            >
              City / State / ZIP
              <SortIcon column="city" />
            </th>
            <th className="border px-4 py-3 text-left">Country</th>
            <th
              className="cursor-pointer border px-4 py-3 text-left"
              onClick={() => onSort("phone")}
            >
              Phone
              <SortIcon column="phone" />
            </th>
            <th
              className="cursor-pointer border px-4 py-3 text-left"
              onClick={() => onSort("email")}
            >
              Email
              <SortIcon column="email" />
            </th>
            <th className="border px-4 py-3 text-left">Web</th>
            <th
              className="cursor-pointer border px-4 py-3 text-left"
              onClick={() => onSort("createdAt")}
            >
              Created
              <SortIcon column="createdAt" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) => {
            const addr = [c.address1, c.address2].filter(Boolean).join(", ");
            return (
              <tr key={c._id} className="hover:bg-gray-50">
                <td className="border px-4 py-2 font-medium">{c.name}</td>
                <td className="max-w-[220px] border px-4 py-2 truncate" title={addr}>
                  {dash(addr || null)}
                </td>
                <td className="border px-4 py-2">{formatCityStateZip(c)}</td>
                <td className="border px-4 py-2">{dash(c.country)}</td>
                <td className="border px-4 py-2 whitespace-nowrap">{dash(c.phone)}</td>
                <td className="border px-4 py-2">
                  {c.email ? (
                    <a
                      href={`mailto:${c.email}`}
                      className="text-[#0099FF] hover:underline"
                    >
                      {c.email}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="max-w-[140px] border px-4 py-2 truncate">
                  {c.web ? (
                    <a
                      href={c.web.startsWith("http") ? c.web : `https://${c.web}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0099FF] hover:underline"
                    >
                      {c.web}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="border px-4 py-2 text-gray-500">
                  {new Date(c.createdAt).toLocaleDateString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
