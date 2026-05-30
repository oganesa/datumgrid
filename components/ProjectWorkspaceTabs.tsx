"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  PROJECT_TAB_ORDER,
  projectTabHref,
  type ProjectWorkspaceTab,
} from "@/lib/project-workspace";

type Props = {
  projectId: string;
};

function activeTab(pathname: string, projectId: string): ProjectWorkspaceTab {
  const prefix = `/projects/${projectId}`;
  if (pathname === prefix || pathname === `${prefix}/`) return "dashboard";
  for (const { slug } of PROJECT_TAB_ORDER) {
    if (slug === "dashboard") continue;
    if (pathname === `${prefix}/${slug}`) return slug;
  }
  return "dashboard";
}

export default function ProjectWorkspaceTabs({ projectId }: Props) {
  const pathname = usePathname();
  const current = activeTab(pathname, projectId);

  return (
    <div className="flex items-end justify-between gap-2 border-b border-[#D5D5D5] bg-white">
      <nav
        className="-mb-px flex min-w-0 flex-1 gap-1 overflow-x-auto px-1 text-sm"
        aria-label="Project sections"
      >
        {PROJECT_TAB_ORDER.map(({ slug, label }) => {
          const href = projectTabHref(projectId, slug);
          const isActive = current === slug;
          return (
            <Link
              key={slug}
              href={href}
              className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 font-medium transition-colors ${
                isActive
                  ? "border-orange-500 text-gray-900"
                  : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        title="History (coming soon)"
        className="mb-1 mr-2 shrink-0 rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        aria-label="History"
      >
        <span className="text-lg" aria-hidden>
          ↻
        </span>
      </button>
    </div>
  );
}
