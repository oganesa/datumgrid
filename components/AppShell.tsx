"use client";

import { useEffect, useState } from "react";
import AiAssistantPanel from "@/components/AiAssistantPanel";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { HeaderTitleProvider } from "@/components/HeaderTitleContext";

export default function AppShell({
  children,
  userLabel,
}: {
  children: React.ReactNode;
  userLabel?: string;
}) {
  const [pinned, setPinned] = useState(true);
  const [aiOpen, setAiOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const sp = localStorage.getItem("dg_sidebar_pinned");
      if (sp !== null) setPinned(sp === "true");
      const sa = localStorage.getItem("dg_ai_open");
      if (sa !== null) setAiOpen(sa === "true");
    } catch {}
    setMounted(true);
  }, []);

  function toggleSidebar() {
    setPinned((prev) => {
      const next = !prev;
      try { localStorage.setItem("dg_sidebar_pinned", String(next)); } catch {}
      return next;
    });
  }

  function toggleAi() {
    setAiOpen((prev) => {
      const next = !prev;
      try { localStorage.setItem("dg_ai_open", String(next)); } catch {}
      return next;
    });
  }

  const sidebarWidth = !mounted ? "16rem" : pinned ? "16rem" : "4rem";
  const effectivePinned = !mounted ? true : pinned;
  const effectiveAiOpen = !mounted ? true : aiOpen;

  return (
    <div className="flex bg-white" style={{ height: "100vh", overflow: "hidden" }}>
      {/* Left sidebar */}
      <Sidebar
        userLabel={userLabel}
        pinned={effectivePinned}
        onTogglePin={toggleSidebar}
      />

      {/* Main area — everything to the right of the sidebar */}
      <div
        className="flex flex-col flex-1 overflow-hidden"
        style={{
          marginLeft: sidebarWidth,
          transition: mounted ? "margin-left 200ms ease" : "none",
        }}
      >
        <HeaderTitleProvider>
          {/* Top header bar */}
          <Header />

          {/* Content row: page content + AI panel */}
          <div className="flex flex-1 overflow-hidden">
            {/* Page content */}
            <main className="flex-1 overflow-y-auto bg-[#F7F9FC] p-8">
              {children}
            </main>

            {/* Persistent AI Assistant panel */}
            <AiAssistantPanel aiOpen={effectiveAiOpen} onToggle={toggleAi} />
          </div>
        </HeaderTitleProvider>
      </div>
    </div>
  );
}
