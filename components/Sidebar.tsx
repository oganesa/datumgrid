"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  { href: "/files",   label: "Files",   Icon: FilesIcon },
  { href: "/reports", label: "Reports", Icon: ReportsIcon },
];

const SYSTEM_CATALOGUES: NavItem[] = [
  { href: "/asset-management/list-of-assets", label: "List of assets",          Icon: CommissioningIcon },
  { href: "/asset-management/asset-type",     label: "Asset type",              Icon: AssetTypeIcon },
  { href: "/customers",                        label: "Customers",               Icon: CustomerIcon },
  { href: "/vendors",                          label: "Vendors",                 Icon: VendorsIcon },
  { href: "/catalog",                          label: "Catalogue",               Icon: CatalogIcon },
  { href: "/material-equipment",               label: "Material & equipment",    Icon: MaterialEquipmentIcon },
];

type SidebarProps = {
  userLabel?: string;
  pinned: boolean;
  onTogglePin: () => void;
};

function DatumMark() {
  return (
    <svg width="26" height="26" viewBox="400 850 285 295" fill="#1C2E4A" aria-hidden>
      <polygon points="566.72,947.45 547.06,926.76 474.22,996.02 473.93,996.29 473.85,996.37 523.44,1048.54 543.45,1069.58 544.02,1069.04 616.66,999.98 595.61,977.84 595.32,977.54 588.53,970.34 588.54,970.33 574.38,955.38 560.04,969.14 553.35,975.55 567.52,990.5 574.02,984.26 588.57,999.27 581.86,1005.66 544.16,1041.49 501.94,997.08 546.35,954.85 552.37,961.2 554.08,959.57" />
      <rect x="533.85" y="986.77" transform="matrix(0.7247 -0.689 0.689 0.7247 -537.6822 650.4631)" width="22.81" height="22.81" />
      <polygon points="548.64,864.12 440.13,967.29 439.95,967.47 459.19,987.78 547.63,903.71 639.71,1000.56 551.09,1084.77 570.38,1105.11 571.15,1104.36 679.31,1001.56" />
      <polygon points="427.74,979.07 407.45,998.32 537.89,1135.88 541.82,1132.16 541.87,1132.22 558.21,1116.68 427.77,979.04" />
    </svg>
  );
}

export default function Sidebar({ userLabel, pinned, onTogglePin }: SidebarProps) {
  const pathname = usePathname();
  const projectsActive = pathname === "/" || pathname.startsWith("/projects/");

  const initials = userLabel
    ? userLabel.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "?";

  // Expanded link class
  function rowCls(active: boolean) {
    return `flex items-center px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${
      active
        ? "text-[#4A90E2] bg-[#EBF3FF]"
        : "text-[#1F2937] hover:bg-[#F5F5F5]"
    }`;
  }

  // Collapsed icon-only button class
  function iconCls(active: boolean) {
    return `flex items-center justify-center w-9 h-9 rounded-lg transition-colors mx-auto ${
      active
        ? "text-[#4A90E2] bg-[#EBF3FF]"
        : "text-[#1F2937] hover:bg-[#F5F5F5]"
    }`;
  }

  return (
    <aside
      className="fixed left-0 top-0 h-screen bg-white border-r border-[#E5EAF2] flex flex-col z-30 overflow-hidden"
      style={{
        width: pinned ? "16rem" : "4rem",
        transition: "width 200ms ease",
      }}
    >
      {/* ── Logo ── */}
      <div className="flex min-h-[3.25rem] items-center border-b border-[#E5EAF2] shrink-0 px-3">
        {pinned ? (
          <Link href="/" className="flex-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[#1C2E4A]">
            <img
              src="/datumgrid-logo.svg"
              alt="DatumGrid"
              width={200}
              height={36}
              decoding="async"
              className="h-8 w-auto object-contain object-left"
            />
          </Link>
        ) : (
          <Link href="/" className="flex items-center justify-center w-9 h-9 mx-auto rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[#1C2E4A]">
            <DatumMark />
          </Link>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2">

        {/* Pin / Unpin toggle */}
        <div className={`flex mb-1 ${pinned ? "justify-end px-2" : "justify-center"}`}>
          <button
            onClick={onTogglePin}
            title={pinned ? "Collapse sidebar" : "Expand sidebar"}
            className="flex items-center justify-center w-7 h-7 rounded text-[#9CA3AF] hover:text-[#1C2E4A] hover:bg-[#F5F5F5] transition-colors"
          >
            {pinned ? (
              /* ‹‹ */
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 17l-5-5 5-5"/><path d="M18 17l-5-5 5-5"/>
              </svg>
            ) : (
              /* ›› */
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 7l5 5-5 5"/><path d="M6 7l5 5-5 5"/>
              </svg>
            )}
          </button>
        </div>

        {/* ─ Main Modules ─ */}
        {pinned ? (
          <p className="px-4 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
            Main Modules
          </p>
        ) : (
          <div className="mx-3 border-t border-[#E5EAF2] my-1" />
        )}

        {pinned ? (
          <Link href="/" className={rowCls(projectsActive)} title="Projects">
            <ProjectsIcon active={projectsActive} />
            Projects
          </Link>
        ) : (
          <Link href="/" className={iconCls(projectsActive)} title="Projects">
            <ProjectsIcon active={projectsActive} />
          </Link>
        )}

        {pinned ? (
          <a href="#" className={rowCls(false)} title="Collaboration">
            <CollaborationIcon active={false} />
            Collaboration
          </a>
        ) : (
          <a href="#" className={iconCls(false)} title="Collaboration">
            <CollaborationIcon active={false} />
          </a>
        )}

        {MAIN_MODULES.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return pinned ? (
            <Link key={href} href={href} className={rowCls(active)} title={label}>
              <Icon active={active} />
              {label}
            </Link>
          ) : (
            <Link key={href} href={href} className={iconCls(active)} title={label}>
              <Icon active={active} />
            </Link>
          );
        })}

        {/* ─ System Catalogues ─ */}
        {pinned ? (
          <p className="px-4 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
            System Catalogues
          </p>
        ) : (
          <div className="mx-3 border-t border-[#E5EAF2] mt-3 mb-1" />
        )}

        {SYSTEM_CATALOGUES.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return pinned ? (
            <Link key={href} href={href} className={rowCls(active)} title={label}>
              <Icon active={active} />
              {label}
            </Link>
          ) : (
            <Link key={href} href={href} className={iconCls(active)} title={label}>
              <Icon active={active} />
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom ── */}
      <div className="shrink-0 border-t border-[#E5EAF2] py-3 px-2">
        {pinned ? (
          <>
            <Link href="/settings" className={rowCls(pathname === "/settings")} title="Settings">
              <SettingsIcon active={pathname === "/settings"} />
              Settings
            </Link>

            {userLabel ? (
              <div className="mt-2 pt-2 border-t border-[#E5EAF2] space-y-1 px-1">
                <p className="truncate text-sm font-medium text-[#1F2937]">{userLabel}</p>
                <a href="/auth/logout" className="block text-sm font-medium text-[#4A90E2] hover:underline">
                  Log out
                </a>
                <p className="pt-1 text-xs text-[#9CA3AF]">Axis Programm 2026</p>
              </div>
            ) : (
              <div className="mt-2 pt-2 border-t border-[#E5EAF2] px-1">
                <p className="text-xs text-[#9CA3AF]">Axis Programm 2026</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Link href="/settings" className={iconCls(pathname === "/settings")} title="Settings">
              <SettingsIcon active={pathname === "/settings"} />
            </Link>
            {userLabel && (
              <div
                title={userLabel}
                className="w-8 h-8 rounded-full bg-[#1C2E4A] text-white text-[11px] font-semibold flex items-center justify-center select-none"
              >
                {initials}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
