import ModuleComingSoon from "@/components/ModuleComingSoon";
import ModuleDisabled from "@/components/ModuleDisabled";
import { getAppSettings } from "@/lib/app-settings";

export const dynamic = "force-dynamic";

export default async function BudgetsPage() {
  const settings = await getAppSettings();
  if (!settings.budgetsEnabled) {
    return <ModuleDisabled title="Budgets" />;
  }
  return <ModuleComingSoon />;
}
