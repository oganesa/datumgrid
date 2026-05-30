import ModuleComingSoon from "@/components/ModuleComingSoon";
import ModuleDisabled from "@/components/ModuleDisabled";
import { getAppSettings } from "@/lib/app-settings";

export const dynamic = "force-dynamic";

export default async function ChangeManagementPage() {
  const settings = await getAppSettings();
  if (!settings.changeManagementEnabled) {
    return <ModuleDisabled title="Change Management" />;
  }
  return <ModuleComingSoon />;
}
