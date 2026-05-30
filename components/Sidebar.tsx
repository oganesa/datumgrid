"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import type { ComponentType } from "react";

import type { SidebarFeatureFlags } from "@/lib/app-settings";

import {
  BudgetsIcon,
  CatalogIcon,
  ChangeManagementIcon,
  CollaborationIcon,
  FilesIcon,
  ProjectsIcon,
  PunchListIcon,
  CommissioningIcon,
  ReportsIcon,
  RfiIcon,
  RisksIcon,
  SettingsIcon,
  SubmittalsIcon,
  TasksIcon,
  CustomerIcon,
  VendorsIcon,
} from "@/components/sidebar-icons";

type NavIcon = ComponentType<{ active: boolean }>;

type ConstructionNavItem = {
  href: string;
  label: string;
  Icon: NavIcon;
  feature?: keyof SidebarFeatureFlags;
};

type MainNavItem = {
  href: string;
  label: string;
  Icon: NavIcon;
  feature?: keyof SidebarFeatureFlags;
};

const MODULES_AFTER_MAIN: MainNavItem[] = [
  { href: "/tasks", label: "Tasks", Icon: TasksIcon, feature: "tasks" },
  { href: "/budgets", label: "Budgets", Icon: BudgetsIcon, feature: "budgets" },
];

const CONSTRUCTION_MANAGEMENT_MODULES: ConstructionNavItem[] = [
  {
    href: "/change-management",
    label: "Change Management",
    Icon: ChangeManagementIcon,
    feature: "changeManagement",
  },
  { href: "/rfi", label: "RFI", Icon: RfiIcon, feature: "rfi" },
  {
    href: "/submittals",
    label: "Submittals",
    Icon: SubmittalsIcon,
    feature: "submittals",
  },
  {
    href: "/risks-issue-log",
    label: "Risks/Issue log",
    Icon: RisksIcon,
    feature: "risksIssueLog",
  },
  {
    href: "/punch-list",
    label: "Punch List",
    Icon: PunchListIcon,
    feature: "punchList",
  },
  {
    href: "/commissioning",
    label: "Commissioning",
    Icon: CommissioningIcon,
  },
];

const MORE_MODULES: { href: string; label: string; Icon: NavIcon }[] = [
  { href: "/customers", label: "Customer", Icon: CustomerIcon },
  { href: "/vendors", label: "Vendors", Icon: VendorsIcon },
  { href: "/catalog", label: "Catalog", Icon: CatalogIcon },
  { href: "/files", label: "Files", Icon: FilesIcon },
  { href: "/reports", label: "Reports", Icon: ReportsIcon },
  { href: "/settings", label: "Settings", Icon: SettingsIcon },
];

const DEFAULT_FLAGS: SidebarFeatureFlags = {
  tasks: true,
  budgets: true,
  risksIssueLog: true,
  changeManagement: true,
  rfi: true,
  submittals: true,
  punchList: true,
};

type SidebarProps = {
  userLabel?: string;
  featureFlags?: SidebarFeatureFlags;
};

const Sidebar = ({
  userLabel,
  featureFlags = DEFAULT_FLAGS,
}: SidebarProps) => {
  const pathname = usePathname();
  const projectsActive = pathname === "/" || pathname.startsWith("/projects/");

  return (
    <aside className="w-64 bg-[#FFFFFF] h-screen flex flex-col text-[#000000] fixed left-0 top-0 border-r border-[#D5D5D5]">
      <div className="border-b border-[#D5D5D5] bg-white px-6 py-5">
        <Link
          href="/"
          className="block rounded-sm bg-white outline-none focus-visible:ring-2 focus-visible:ring-[#243757] focus-visible:ring-offset-2"
        >
          <img
            src="/datumgrid-logo.png"
            alt="DatumGrid"
            width={220}
            height={56}
            decoding="async"
            className="block h-9 w-auto max-w-full bg-transparent object-contain object-left"
          />
        </Link>
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

        {MODULES_AFTER_MAIN.filter(
          (m) => !m.feature || featureFlags[m.feature]
        ).map(({ href, label, Icon }) => {
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

        {CONSTRUCTION_MANAGEMENT_MODULES.filter(
          (m) => !m.feature || featureFlags[m.feature]
        ).map(({ href, label, Icon }) => {
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
