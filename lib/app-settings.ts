import { cache } from "react";

import { connectDB } from "@/lib/mongodb";
import AppSettings from "@/models/AppSettings";

export type SerializedAppSettings = {
  tasksEnabled: boolean;
  budgetsEnabled: boolean;
  risksIssueLogEnabled: boolean;
  changeManagementEnabled: boolean;
  rfiEnabled: boolean;
  submittalsEnabled: boolean;
  punchListEnabled: boolean;
};

const DEFAULTS: SerializedAppSettings = {
  tasksEnabled: true,
  budgetsEnabled: true,
  risksIssueLogEnabled: true,
  changeManagementEnabled: true,
  rfiEnabled: true,
  submittalsEnabled: true,
  punchListEnabled: true,
};

function serialize(raw: Record<string, unknown>): SerializedAppSettings {
  return {
    tasksEnabled: Boolean(raw.tasksEnabled ?? true),
    budgetsEnabled: Boolean(raw.budgetsEnabled ?? true),
    risksIssueLogEnabled: Boolean(raw.risksIssueLogEnabled ?? true),
    changeManagementEnabled: Boolean(raw.changeManagementEnabled ?? true),
    rfiEnabled: Boolean(raw.rfiEnabled ?? true),
    submittalsEnabled: Boolean(raw.submittalsEnabled ?? true),
    punchListEnabled: Boolean(raw.punchListEnabled ?? true),
  };
}

async function loadAppSettings(): Promise<SerializedAppSettings> {
  await connectDB();
  let doc = await AppSettings.findOne().lean();
  if (!doc) {
    await AppSettings.create({ ...DEFAULTS });
    doc = await AppSettings.findOne().lean();
  }
  if (!doc) return { ...DEFAULTS };
  return serialize(doc as Record<string, unknown>);
}

/** Dedupes within a request (layout + pages). */
export const getAppSettings = cache(loadAppSettings);

export type SidebarFeatureFlags = {
  tasks: boolean;
  budgets: boolean;
  risksIssueLog: boolean;
  changeManagement: boolean;
  rfi: boolean;
  submittals: boolean;
  punchList: boolean;
};

export function toSidebarFeatureFlags(
  s: SerializedAppSettings
): SidebarFeatureFlags {
  return {
    tasks: s.tasksEnabled,
    budgets: s.budgetsEnabled,
    risksIssueLog: s.risksIssueLogEnabled,
    changeManagement: s.changeManagementEnabled,
    rfi: s.rfiEnabled,
    submittals: s.submittalsEnabled,
    punchList: s.punchListEnabled,
  };
}
