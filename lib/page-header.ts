/**
 * Page title shown in the global top bar (left side). Kept in sync with main app routes.
 */
const EXACT: Record<string, string> = {
  "/": "Projects",
  "/catalog": "Catalog",
  "/customers": "Customers",
  "/tasks": "Tasks",
  "/budgets": "Budgets",
  "/change-management": "Change Management",
  "/rfi": "RFI",
  "/submittals": "Submittals",
  "/risks-issue-log": "Risks/Issue log",
  "/punch-list": "Punch List",
  "/commissioning": "Commissioning",
  "/vendors": "Vendors",
  "/files": "Files",
  "/reports": "Reports",
  "/settings": "Settings",
};

function titleCaseKebab(segment: string): string {
  return segment
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function pageTitleForPathname(pathname: string | null): string {
  if (pathname == null || pathname === "") return "Projects";

  const normalized = pathname.endsWith("/") && pathname.length > 1
    ? pathname.slice(0, -1)
    : pathname;

  const exact = EXACT[normalized];
  if (exact) return exact;

  if (normalized.startsWith("/projects/")) {
    return "Project";
  }

  const segments = normalized.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  if (last) return titleCaseKebab(last);

  return "Projects";
}
