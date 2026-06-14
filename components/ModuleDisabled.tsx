import Link from "next/link";

type Props = {
  title: string;
};

export default function ModuleDisabled({ title }: Props) {
  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-lg border border-[#E5EAF2] bg-white p-8 shadow-sm">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      <p className="text-sm text-gray-600">
        This module has been turned off in Settings. An administrator can enable it
        again from the Settings page.
      </p>
      <Link
        href="/settings"
        className="inline-flex rounded-md bg-[#4A90E2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7FB3FF]"
      >
        Open Settings
      </Link>
    </div>
  );
}
