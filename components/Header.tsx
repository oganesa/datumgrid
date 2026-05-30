"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useHeaderTitle } from "@/components/HeaderTitleContext";
import { pageTitleForPathname } from "@/lib/page-header";

import NewProjectModal from "./NewProjectModal";
import NewCustomerModal from "./NewCustomerModal";
import NewVendorModal from "./NewVendorModal";
import NewCostGroupModal from "./catalog/NewCostGroupModal";
import NewCostItemModal from "./catalog/NewCostItemModal";

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { titleOverride } = useHeaderTitle();
  const isCatalog = pathname === "/catalog";
  const isCustomers = pathname === "/customers";
  const isVendors = pathname === "/vendors";

  const [projectOpen, setProjectOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [vendorOpen, setVendorOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [itemOpen, setItemOpen] = useState(false);

  const refresh = () => router.refresh();

  const pageTitle = titleOverride ?? pageTitleForPathname(pathname);

  return (
    <>
      <header className="flex min-h-[3.25rem] items-center justify-between gap-4 border-b border-[#D5D5D5] bg-white px-8 py-4">
        <h1 className="min-w-0 shrink text-xl font-semibold tracking-tight text-gray-900">
          {pageTitle}
        </h1>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
          {isCatalog ? (
            <>
              <button
                type="button"
                onClick={() => setGroupOpen(true)}
                className="rounded-md border border-[#0099FF] bg-white px-4 py-2 text-sm font-bold text-[#0099FF] shadow-sm transition hover:bg-[#D5EEFF]"
              >
                + New cost group
              </button>
              <button
                type="button"
                onClick={() => setItemOpen(true)}
                className="rounded-md bg-[#0099FF] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#2AAAFF]"
              >
                + New cost item
              </button>
            </>
          ) : isCustomers ? (
            <button
              type="button"
              onClick={() => setCustomerOpen(true)}
              className="rounded-md bg-[#0099FF] px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#2AAAFF]"
            >
              + New customer
            </button>
          ) : isVendors ? (
            <button
              type="button"
              onClick={() => setVendorOpen(true)}
              className="rounded-md bg-[#0099FF] px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#2AAAFF]"
            >
              + New vendor
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setProjectOpen(true)}
              className="rounded-md bg-[#0099FF] px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#2AAAFF]"
            >
              + NEW PROJECT
            </button>
          )}
        </div>
      </header>

      <NewProjectModal isOpen={projectOpen} onClose={() => setProjectOpen(false)} />
      <NewCustomerModal
        isOpen={customerOpen}
        onClose={() => setCustomerOpen(false)}
        onSuccess={refresh}
      />
      <NewVendorModal
        isOpen={vendorOpen}
        onClose={() => setVendorOpen(false)}
        onSuccess={refresh}
      />
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
