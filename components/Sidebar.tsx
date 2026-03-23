"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import type { ComponentType } from "react";

import {
  BudgetsIcon,
  CatalogIcon,
  ChangeManagementIcon,
  CollaborationIcon,
  FilesIcon,
  ProjectsIcon,
  PunchListIcon,
  ReportsIcon,
  RfiIcon,
  RisksIcon,
  SettingsIcon,
  SubmittalsIcon,
  TasksIcon,
  VendorsIcon,
} from "@/components/sidebar-icons";

type NavIcon = ComponentType<{ active: boolean }>;

const MODULES_AFTER_MAIN: { href: string; label: string; Icon: NavIcon }[] = [
  { href: "/tasks", label: "Tasks", Icon: TasksIcon },
  { href: "/budgets", label: "Budgets", Icon: BudgetsIcon },
];

const CONSTRUCTION_MANAGEMENT_MODULES: {
  href: string;
  label: string;
  Icon: NavIcon;
}[] = [
  {
    href: "/change-management",
    label: "Change Management",
    Icon: ChangeManagementIcon,
  },
  { href: "/rfi", label: "RFI", Icon: RfiIcon },
  { href: "/submittals", label: "Submittals", Icon: SubmittalsIcon },
  { href: "/risks-issue-log", label: "Risks/Issue log", Icon: RisksIcon },
  { href: "/punch-list", label: "Punch List", Icon: PunchListIcon },
];

const MORE_MODULES: { href: string; label: string; Icon: NavIcon }[] = [
  { href: "/vendors", label: "Vendors", Icon: VendorsIcon },
  { href: "/catalog", label: "Catalog", Icon: CatalogIcon },
  { href: "/files", label: "Files", Icon: FilesIcon },
  { href: "/reports", label: "Reports", Icon: ReportsIcon },
  { href: "/settings", label: "Settings", Icon: SettingsIcon },
];

type SidebarProps = {
  userLabel?: string;
};

const Sidebar = ({ userLabel }: SidebarProps) => {
  const pathname = usePathname();
  const projectsActive = pathname === "/";

  return (
    <aside className="w-64 bg-[#FFFFFF] h-screen flex flex-col text-[#000000] fixed left-0 top-0 border-r border-[#D5D5D5]">
      <div className="p-6 border-b border-[#D5D5D5] font-bold text-2xl tracking-tighter text-[#0099FF]">
        DatumGrid
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="text-xs font-semibold text-[#808080] uppercase tracking-wider px-4 mb-4">
          Main Modules
        </div>

        <Link
          href="/"
          className={`flex items-center px-4 py-3 rounded-lg font-medium transition-all ${
            projectsActive
              ? "text-[#0099FF] bg-[#D5EEFF]"
              : "text-[#000000] hover:bg-[#F5F5F5]"
          }`}
        >
          <ProjectsIcon active={projectsActive} />
          Projects
        </Link>

        <a
          href="#"
          className="flex items-center px-4 py-3 text-[#000000] hover:bg-[#F5F5F5] rounded-lg transition-all font-medium"
        >
          <CollaborationIcon active={false} />
          Collaboration
        </a>

        {MODULES_AFTER_MAIN.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center px-4 py-3 rounded-lg font-medium transition-all ${
                active
                  ? "text-[#0099FF] bg-[#D5EEFF]"
                  : "text-[#000000] hover:bg-[#F5F5F5]"
              }`}
            >
              <Icon active={active} />
              {label}
            </Link>
          );
        })}

        <div className="text-xs font-semibold text-[#808080] uppercase tracking-wider px-4 mt-6 mb-3">
          Construction management
        </div>

        {CONSTRUCTION_MANAGEMENT_MODULES.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center px-4 py-3 rounded-lg font-medium transition-all ${
                active
                  ? "text-[#0099FF] bg-[#D5EEFF]"
                  : "text-[#000000] hover:bg-[#F5F5F5]"
              }`}
            >
              <Icon active={active} />
              {label}
            </Link>
          );
        })}

        <div className="mt-6 space-y-2">
          {MORE_MODULES.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center px-4 py-3 rounded-lg font-medium transition-all ${
                  active
                    ? "text-[#0099FF] bg-[#D5EEFF]"
                    : "text-[#000000] hover:bg-[#F5F5F5]"
                }`}
              >
                <Icon active={active} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-[#D5D5D5] space-y-3 shrink-0">
        {userLabel ? (
          <p className="text-sm font-medium text-[#000000] leading-snug px-1">
            {userLabel}
          </p>
        ) : null}
        <a
          href="/auth/logout"
          className="block text-sm font-medium text-[#0099FF] hover:underline px-1"
        >
          Log out
        </a>
        <p className="text-[#808080] text-xs px-1 pt-1 border-t border-[#D5D5D5]">
          Axis Programm 2026
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
