"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  setModuleToggle,
  type ModuleToggleField,
} from "@/actions/appSettingsActions";
import type { SerializedAppSettings } from "@/lib/app-settings";

type Section = {
  field: ModuleToggleField;
  title: string;
  description: string;
};

const SECTIONS: Section[] = [
  {
    field: "tasksEnabled",
    title: "Tasks",
    description:
      "Task tracking under Main modules. When off, Tasks is hidden from the sidebar and the route is disabled.",
  },
  {
    field: "budgetsEnabled",
    title: "Budgets",
    description:
      "Budget views and cost tracking. When off, Budgets is hidden and unavailable.",
  },
  {
    field: "risksIssueLogEnabled",
    title: "Risks / Issue log",
    description:
      "Risks and issue log under Construction management. When off, the link is removed and the page is disabled.",
  },
  {
    field: "changeManagementEnabled",
    title: "Change Management",
    description:
      "Change orders, contract changes, and related workflows. When off, the sidebar link is hidden and the module page is unavailable.",
  },
  {
    field: "rfiEnabled",
    title: "RFI",
    description:
      "Requests for information between project parties. When off, navigation and direct access to RFI are disabled.",
  },
  {
    field: "submittalsEnabled",
    title: "Submittals",
    description:
      "Shop drawings, product data, and submittal review. When off, the Submittals area is hidden from the team.",
  },
  {
    field: "punchListEnabled",
    title: "Punch List",
    description:
      "Punch list tracking for closeout items. When off, the Punch List module is turned off for everyone.",
  },
];

type Props = {
  initial: SerializedAppSettings;
};

export default function ModuleFeatureSettings({ initial }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<SerializedAppSettings>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(field: ModuleToggleField, next: boolean) {
    setError(null);
    const prev = values[field];
    setValues((v) => ({ ...v, [field]: next }));
    startTransition(async () => {
      const result = await setModuleToggle(field, next);
      if (!result.success) {
        setValues((v) => ({ ...v, [field]: prev }));
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Control which modules appear in the sidebar and stay available in the app
          (main modules and construction management).
        </p>
      </div>

      {error ? (
        <div
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {SECTIONS.map((section) => {
        const on = values[section.field];
        return (
          <section
            key={section.field}
            className="rounded-lg border border-[#E5EAF2] bg-white p-5 shadow-sm"
          >
            <h2 className="text-base font-semibold text-gray-900">
              {section.title}
            </h2>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {on ? "Module is on" : "Module is off"}
                </p>
                <p className="text-xs text-gray-500">
                  Turn this module on or off for the whole organization.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                disabled={pending}
                onClick={() => toggle(section.field, !on)}
                className={`relative inline-flex h-8 w-14 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A90E2] focus-visible:ring-offset-2 disabled:opacity-50 ${
                  on ? "bg-[#4A90E2]" : "bg-gray-300"
                }`}
              >
                <span className="sr-only">Toggle {section.title}</span>
                <span
                  className={`pointer-events-none absolute top-0.5 left-0.5 h-7 w-7 rounded-full bg-white shadow transition-transform ${
                    on ? "translate-x-[1.625rem]" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <p className="mt-4 text-sm text-gray-600">{section.description}</p>
          </section>
        );
      })}
    </div>
  );
}
