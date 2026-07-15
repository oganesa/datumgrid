export const PROJECT_TAB_SLUGS = [
  "documents",
  "schedule",
  "plans",
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
  { slug: "documents", label: "Documents" },
  { slug: "schedule", label: "Schedule" },
  { slug: "plans", label: "Plans" },
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
