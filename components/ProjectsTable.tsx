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

export default function ProjectsTable({ projects }: { projects: Project[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  function onSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const sortedProjects = [...projects].sort((a, b) => {
    const aVal = String(a[sortKey] ?? '');
    const bVal = String(b[sortKey] ?? '');

    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  function SortIcon({ column }: { column: SortKey }) {
    if (column !== sortKey) return <span className="ml-1 text-gray-300">⇅</span>;
    return sortDir === 'asc'
      ? <span className="ml-1">▲</span>
      : <span className="ml-1">▼</span>;
  }

  return (
    <div className="bg-white border rounded-md shadow-sm overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th
              className="px-4 py-3 border text-left cursor-pointer"
              onClick={() => onSort('number')}
            >
              Project #
              <SortIcon column="number" />
            </th>

            <th
              className="px-4 py-3 border text-left cursor-pointer"
              onClick={() => onSort('name')}
            >
              Project Name
              <SortIcon column="name" />
            </th>

            <th
              className="px-4 py-3 border text-left cursor-pointer"
              onClick={() => onSort('customerName')}
            >
              Customer
              <SortIcon column="customerName" />
            </th>

            <th className="px-4 py-3 border text-left">
              Description
            </th>

            <th
              className="px-4 py-3 border text-left cursor-pointer"
              onClick={() => onSort('startDate')}
            >
              Start Date
              <SortIcon column="startDate" />
            </th>

            <th
              className="px-4 py-3 border text-left cursor-pointer"
              onClick={() => onSort('endDate')}
            >
              End Date
              <SortIcon column="endDate" />
            </th>

            <th
              className="px-4 py-3 border text-left cursor-pointer"
              onClick={() => onSort('status')}
            >
              Status
              <SortIcon column="status" />
            </th>

            <th
              className="px-4 py-3 border text-left cursor-pointer"
              onClick={() => onSort('createdAt')}
            >
              Created
              <SortIcon column="createdAt" />
            </th>
          </tr>
        </thead>

        <tbody>
          {sortedProjects.map((project) => (
            <tr key={project._id} className="hover:bg-gray-50">
              <td className="px-4 py-2 border">
                <Link
                  href={`/projects/${project._id}`}
                  className="font-medium text-[#0099FF] hover:underline"
                >
                  {project.number}
                </Link>
              </td>
              <td className="px-4 py-2 border font-medium">
                <Link
                  href={`/projects/${project._id}`}
                  className="text-[#0099FF] hover:underline"
                >
                  {project.name}
                </Link>
              </td>
              <td className="px-4 py-2 border text-gray-800">
                {project.customerName?.trim() ? project.customerName : '—'}
              </td>
              <td className="px-4 py-2 border truncate max-w-[300px]">
                {project.description || '-'}
              </td>
              <td className="px-4 py-2 border">
                {project.startDate
                  ? new Date(project.startDate).toLocaleDateString()
                  : '-'}
              </td>
              <td className="px-4 py-2 border">
                {project.endDate
                  ? new Date(project.endDate).toLocaleDateString()
                  : '-'}
              </td>
              <td className="px-4 py-2 border">
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                  {project.status}
                </span>
              </td>
              <td className="px-4 py-2 border text-gray-500">
                {new Date(project.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}