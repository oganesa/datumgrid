"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import type { ComponentType } from "react";

import {
  AssetTypeIcon,
  CatalogIcon,
  CollaborationIcon,
  CommissioningIcon,
  CustomerIcon,
  FilesIcon,
  MaterialEquipmentIcon,
  ProjectsIcon,
  ReportsIcon,
  SettingsIcon,
  VendorsIcon,
} from "@/components/sidebar-icons";

type NavIcon = ComponentType<{ active: boolean }>;
type NavItem = { href: string; label: string; Icon: NavIcon };

const MAIN_MODULES: NavItem[] = [
  { href: "/files",    label: "Files",    Icon: FilesIcon },
  { href: "/reports",  label: "Reports",  Icon: ReportsIcon },
];

const SYSTEM_CATALOGUES: NavItem[] = [
  { href: "/asset-management/list-of-assets", label: "List of assets",        Icon: CommissioningIcon },
  { href: "/asset-management/asset-type",     label: "Asset type",            Icon: AssetTypeIcon },
  { href: "/customers",                        label: "Customers",             Icon: CustomerIcon },
  { href: "/vendors",                          label: "Vendors",               Icon: VendorsIcon },
  { href: "/catalog",                          label: "Catalogue",             Icon: CatalogIcon },
  { href: "/material-equipment",               label: "Material and equipment",Icon: MaterialEquipmentIcon },
];

type SidebarProps = {
  userLabel?: string;
};

const Sidebar = ({ userLabel }: SidebarProps) => {
  const pathname = usePathname();
  const projectsActive = pathname === "/" || pathname.startsWith("/projects/");

  function linkCls(active: boolean) {
    return `flex items-center px-4 py-3 rounded-lg font-medium transition-all ${
      active ? "text-[#4A90E2] bg-[#EBF3FF]" : "text-[#1F2937] hover:bg-[#F5F5F5]"
    }`;
  }

  return (
    <aside className="w-64 bg-[#FFFFFF] h-screen flex flex-col text-[#1F2937] fixed left-0 top-0 border-r border-[#E5EAF2]">
      {/* Logo */}
      <div className="border-b border-[#E5EAF2] bg-white px-6 py-5 shrink-0">
        <Link
          href="/"
          className="block rounded-sm bg-white outline-none focus-visible:ring-2 focus-visible:ring-[#1C2E4A] focus-visible:ring-offset-2"
        >
          <img
            src="/datumgrid-logo.svg"
            alt="DatumGrid"
            width={220}
            height={56}
            decoding="async"
            className="block h-9 w-auto max-w-full bg-transparent object-contain object-left"
          />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {/* Main Modules */}
        <div className="px-4 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
          Main Modules
        </div>

        <Link href="/" className={linkCls(projectsActive)}>
          <ProjectsIcon active={projectsActive} />
          Projects
        </Link>

        <a href="#" className={linkCls(false)}>
          <CollaborationIcon active={false} />
          Collaboration
        </a>

        {MAIN_MODULES.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className={linkCls(active)}>
              <Icon active={active} />
              {label}
            </Link>
          );
        })}

        {/* System Catalogues */}
        <div className="px-4 pb-2 pt-5 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
          System Catalogues
        </div>

        {SYSTEM_CATALOGUES.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} className={linkCls(active)}>
              <Icon active={active} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom — Settings + user info */}
      <div className="shrink-0 border-t border-[#E5EAF2] p-4 space-y-1">
        <Link
          href="/settings"
          className={linkCls(pathname === "/settings")}
        >
          <SettingsIcon active={pathname === "/settings"} />
          Settings
        </Link>

        {userLabel ? (
          <div className="mt-3 border-t border-[#E5EAF2] pt-3 space-y-2">
            <p className="truncate px-1 text-sm font-medium text-[#1F2937]">
              {userLabel}
            </p>
            <a
              href="/auth/logout"
              className="block px-1 text-sm font-medium text-[#4A90E2] hover:underline"
            >
              Log out
            </a>
            <p className="px-1 pt-1 text-xs text-[#6B7280]">
              Axis Programm 2026
            </p>
          </div>
        ) : (
          <div className="mt-3 border-t border-[#E5EAF2] pt-3">
            <p className="px-1 text-xs text-[#6B7280]">Axis Programm 2026</p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
