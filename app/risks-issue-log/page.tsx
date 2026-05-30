import ModuleComingSoon from "@/components/ModuleComingSoon";
import ModuleDisabled from "@/components/ModuleDisabled";
import { getAppSettings } from "@/lib/app-settings";

export const dynamic = "force-dynamic";

export default async function RisksIssueLogPage() {
  const settings = await getAppSettings();
  if (!settings.risksIssueLogEnabled) {
    return <ModuleDisabled title="Risks / Issue log" />;
  }
  return <ModuleComingSoon />;
}
