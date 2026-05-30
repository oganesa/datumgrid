import ModuleComingSoon from "@/components/ModuleComingSoon";
import ModuleDisabled from "@/components/ModuleDisabled";
import { getAppSettings } from "@/lib/app-settings";

export const dynamic = "force-dynamic";

export default async function PunchListPage() {
  const settings = await getAppSettings();
  if (!settings.punchListEnabled) {
    return <ModuleDisabled title="Punch List" />;
  }
  return <ModuleComingSoon />;
}
