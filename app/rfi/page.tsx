import ModuleComingSoon from "@/components/ModuleComingSoon";
import ModuleDisabled from "@/components/ModuleDisabled";
import { getAppSettings } from "@/lib/app-settings";

export const dynamic = "force-dynamic";

export default async function RfiPage() {
  const settings = await getAppSettings();
  if (!settings.rfiEnabled) {
    return <ModuleDisabled title="RFI" />;
  }
  return <ModuleComingSoon />;
}
