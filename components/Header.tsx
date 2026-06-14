"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useHeaderTitle } from "@/components/HeaderTitleContext";
import { pageTitleForPathname } from "@/lib/page-header";

import NewProjectModal from "./NewProjectModal";
import NewCostGroupModal from "./catalog/NewCostGroupModal";
import NewCostItemModal from "./catalog/NewCostItemModal";

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { titleOverride } = useHeaderTitle();
  const isCatalog = pathname === "/catalog";

  const [projectOpen, setProjectOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [itemOpen, setItemOpen] = useState(false);

  const refresh = () => router.refresh();

  const pageTitle = titleOverride ?? pageTitleForPathname(pathname);

  return (
    <>
      <header className="flex min-h-[3.25rem] items-center justify-between gap-4 border-b border-[#E5EAF2] bg-white px-8 py-4">
        <h1 className="min-w-0 shrink text-xl font-semibold tracking-tight text-gray-900">
          {pageTitle}
        </h1>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
          {isCatalog ? (
            <>
              <button
                type="button"
                onClick={() => setGroupOpen(true)}
                className="rounded-md border border-[#4A90E2] bg-white px-4 py-2 text-sm font-bold text-[#4A90E2] shadow-sm transition hover:bg-[#EBF3FF]"
              >
                + New cost group
              </button>
              <button
                type="button"
                onClick={() => setItemOpen(true)}
                className="rounded-md bg-[#4A90E2] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#7FB3FF]"
              >
                + New cost item
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setProjectOpen(true)}
              className="rounded-md bg-[#4A90E2] px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#7FB3FF]"
            >
              + NEW PROJECT
            </button>
          )}
        </div>
      </header>

      <NewProjectModal isOpen={projectOpen} onClose={() => setProjectOpen(false)} />
      <NewCostGroupModal
        isOpen={groupOpen}
        onClose={() => setGroupOpen(false)}
        onSuccess={refresh}
      />
      <NewCostItemModal
        isOpen={itemOpen}
        onClose={() => setItemOpen(false)}
        onSuccess={refresh}
      />
    </>
  );
};

export default Header;
