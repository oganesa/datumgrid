import ModuleComingSoon from "@/components/ModuleComingSoon";
import ModuleDisabled from "@/components/ModuleDisabled";
import { getAppSettings } from "@/lib/app-settings";

export const dynamic = "force-dynamic";

export default async function SubmittalsPage() {
  const settings = await getAppSettings();
  if (!settings.submittalsEnabled) {
    return <ModuleDisabled title="Submittals" />;
  }
  return <ModuleComingSoon />;
}
