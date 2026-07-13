"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import AiAssistantSettings from "@/components/settings/AiAssistantSettings";
import DocumentsSettings from "@/components/settings/DocumentsSettings";
import ModuleFeatureSettings from "@/components/settings/ModuleFeatureSettings";
import type { SerializedAppSettings } from "@/lib/app-settings";

type Section = "modules" | "ai-assistant" | "documents";

const NAV: { id: Section; label: string; icon: React.ReactNode }[] = [
  {
    id: "modules",
    label: "Modules",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: "documents",
    label: "Documents",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    id: "ai-assistant",
    label: "AI Assistant",
    icon: (
      <svg width="16" height="16" viewBox="400 850 285 295" fill="currentColor">
        <polygon points="566.72,947.45 547.06,926.76 474.22,996.02 473.93,996.29 473.85,996.37 523.44,1048.54 543.45,1069.58 544.02,1069.04 616.66,999.98 595.61,977.84 595.32,977.54 588.53,970.34 588.54,970.33 574.38,955.38 560.04,969.14 553.35,975.55 567.52,990.5 574.02,984.26 588.57,999.27 581.86,1005.66 544.16,1041.49 501.94,997.08 546.35,954.85 552.37,961.2 554.08,959.57" />
        <rect x="533.85" y="986.77" transform="matrix(0.7247 -0.689 0.689 0.7247 -537.6822 650.4631)" width="22.81" height="22.81" />
        <polygon points="548.64,864.12 440.13,967.29 439.95,967.47 459.19,987.78 547.63,903.71 639.71,1000.56 551.09,1084.77 570.38,1105.11 571.15,1104.36 679.31,1001.56" />
        <polygon points="427.74,979.07 407.45,998.32 537.89,1135.88 541.82,1132.16 541.87,1132.22 558.21,1116.68 427.77,979.04" />
      </svg>
    ),
  },
];

type Props = {
  initial: SerializedAppSettings;
};

function SettingsShellInner({ initial }: Props) {
  const searchParams = useSearchParams();
  const [active, setActive] = useState<Section>(() => {
    const s = searchParams.get("section");
    if (s === "documents" || s === "ai-assistant" || s === "modules") return s;
    return "modules";
  });

  useEffect(() => {
    const s = searchParams.get("section");
    if (s === "documents" || s === "ai-assistant" || s === "modules") setActive(s);
  }, [searchParams]);

  return (
    <div className="flex min-h-[calc(100vh-3.25rem)] -m-6">
      {/* ── Left sidebar ── */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-[#E5EAF2] bg-white">
        {/* Back to app */}
        <div className="border-b border-[#E5EAF2] px-3 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#6B7280] transition-colors hover:bg-[#F7F9FC] hover:text-[#1C2E4A]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back to app
          </Link>
        </div>

        {/* Section label */}
        <div className="px-6 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-widest text-[#9CA3AF]">
          Settings
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-0.5 px-3 py-1">
          {NAV.map(({ id, label, icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active === id
                  ? "bg-[#EBF3FF] text-[#4A90E2]"
                  : "text-[#374151] hover:bg-[#F7F9FC] hover:text-[#1C2E4A]"
              }`}
            >
              <span className={active === id ? "text-[#4A90E2]" : "text-[#6B7280]"}>
                {icon}
              </span>
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto bg-[#F7F9FC] px-8 py-8">
        <div className="mx-auto max-w-2xl">
          {active === "modules" && <ModuleFeatureSettings initial={initial} />}
          {active === "documents" && <DocumentsSettings />}
          {active === "ai-assistant" && (
            <AiAssistantSettings
              initialKey={initial.geminiApiKey}
              initialModel={initial.geminiModel}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default function SettingsShell({ initial }: Props) {
  return (
    <Suspense>
      <SettingsShellInner initial={initial} />
    </Suspense>
  );
}
