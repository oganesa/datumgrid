type ModuleComingSoonProps = {
  title: string;
};

export default function ModuleComingSoon({ title }: ModuleComingSoonProps) {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      <p className="mt-2 text-gray-500">This module is not implemented yet.</p>
    </div>
  );
}
