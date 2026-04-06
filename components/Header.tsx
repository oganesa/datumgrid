"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import NewProjectModal from "./NewProjectModal";
import NewCostGroupModal from "./catalog/NewCostGroupModal";
import NewCostItemModal from "./catalog/NewCostItemModal";

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const isCatalog = pathname === "/catalog";

  const [projectOpen, setProjectOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [itemOpen, setItemOpen] = useState(false);

  const refresh = () => router.refresh();

  return (
    <>
      <header className="flex items-center justify-end gap-3 px-8 py-4 bg-white border-b border-[#D5D5D5]">
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
        ) : (
          <button
            type="button"
            onClick={() => setProjectOpen(true)}
            className="rounded-md bg-[#0099FF] px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#2AAAFF]"
          >
            + NEW PROJECT
          </button>
        )}
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
