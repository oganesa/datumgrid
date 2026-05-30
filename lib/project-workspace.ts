export const PROJECT_TAB_SLUGS = [
  "budget",
  "plans",
  "documents",
  "specifications",
  "schedule",
  "todos",
  "daily-logs",
  "time",
  "files",
  "messages",
  "reports",
  "commissioning",
] as const;

export type ProjectTabSlug = (typeof PROJECT_TAB_SLUGS)[number];

export type ProjectWorkspaceTab = "dashboard" | ProjectTabSlug;

const SLUG_SET = new Set<string>(PROJECT_TAB_SLUGS);

export const PROJECT_TAB_ORDER: {
  slug: ProjectWorkspaceTab;
  label: string;
}[] = [
  { slug: "dashboard", label: "Dashboard" },
  { slug: "budget", label: "Budget" },
  { slug: "plans", label: "Plans" },
  { slug: "documents", label: "Documents" },
  { slug: "specifications", label: "Specifications" },
  { slug: "schedule", label: "Schedule" },
  { slug: "todos", label: "To-do's" },
  { slug: "daily-logs", label: "Daily logs" },
  { slug: "time", label: "Time" },
  { slug: "files", label: "Files" },
  { slug: "messages", label: "Messages" },
  { slug: "reports", label: "Reports" },
  { slug: "commissioning", label: "Commissioning" },
];

export function projectTabHref(
  projectId: string,
  tab: ProjectWorkspaceTab
): string {
  if (tab === "dashboard") return `/projects/${projectId}`;
  return `/projects/${projectId}/${tab}`;
}

/** Returns null if the URL segment is not a valid workspace tab. */
export function parseProjectSection(
  section: string[] | undefined
): ProjectWorkspaceTab | null {
  if (!section || section.length === 0) return "dashboard";
  if (section.length !== 1) return null;
  const s = section[0];
  if (!s || !SLUG_SET.has(s)) return null;
  return s as ProjectTabSlug;
}
