'use client';

import Link from 'next/link';
import { useState } from 'react';

type Project = {
  _id: string;
  name: string;
  number: string;
  description?: string | null;
  customerName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
  createdAt: string;
};

type SortKey =
  | 'number'
  | 'name'
  | 'customerName'
  | 'startDate'
  | 'endDate'
  | 'status'
  | 'createdAt';

const th =
  'border border-gray-200 bg-gray-100 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 whitespace-nowrap cursor-pointer select-none';
const thPlain =
  'border border-gray-200 bg-gray-100 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 whitespace-nowrap';
const td =
  'border border-gray-200 px-3 py-2 text-sm text-gray-800 whitespace-nowrap';

function dash(v: string | null | undefined) {
  return v?.trim() ? v : '—';
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString();
}

export default function ProjectsTable({ projects }: { projects: Project[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  function onSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const sorted = [...projects].sort((a, b) => {
    const av = String(a[sortKey] ?? '');
    const bv = String(b[sortKey] ?? '');
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  function SortIcon({ col }: { col: SortKey }) {
    if (col !== sortKey) return <span className="ml-1 text-gray-400">⇅</span>;
    return <span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>;
  }

  const cols: { key: SortKey; label: string }[] = [
    { key: 'number',       label: 'Project #' },
    { key: 'name',         label: 'Project Name' },
    { key: 'customerName', label: 'Customer' },
    { key: 'startDate',    label: 'Start Date' },
    { key: 'endDate',      label: 'End Date' },
    { key: 'status',       label: 'Status' },
    { key: 'createdAt',    label: 'Created' },
  ];

  return (
    <div className="overflow-x-auto rounded-md border border-gray-200 bg-white shadow-sm">
      <table className="w-max min-w-full border-collapse text-left">
        <thead>
          <tr>
            {cols.map(({ key, label }) => (
              <th key={key} className={th} onClick={() => onSort(key)}>
                {label}
                <SortIcon col={key} />
              </th>
            ))}
            <th className={thPlain}>Description</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr key={p._id} className="hover:bg-gray-50">
              <td className={td}>
                <Link href={`/projects/${p._id}`} className="text-[#0099FF] hover:underline">
                  {p.number}
                </Link>
              </td>
              <td className={td}>
                <Link href={`/projects/${p._id}`} className="text-[#0099FF] hover:underline">
                  {p.name}
                </Link>
              </td>
              <td className={td}>{dash(p.customerName)}</td>
              <td className={td}>{fmtDate(p.startDate)}</td>
              <td className={td}>{fmtDate(p.endDate)}</td>
              <td className={td}>{p.status}</td>
              <td className={td}>{fmtDate(p.createdAt)}</td>
              <td className={`${td} max-w-[18rem] truncate`} title={p.description ?? undefined}>
                {dash(p.description)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
