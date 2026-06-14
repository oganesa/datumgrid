import { auth0, isAuth0Configured } from "@/lib/auth0";
import { getProjects } from "@/lib/projects";
import ProjectsTable from "@/components/ProjectsTable";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = isAuth0Configured() ? await auth0.getSession() : null;

  if (!session) {
    return (
      <div className="flex min-h-screen">
        {/* Left — brand panel */}
        <div className="hidden lg:flex w-1/2 flex-col items-center justify-center bg-[#1C2E4A] px-16">
          <img
            src="/datumgrid-logo.svg"
            alt="DatumGrid"
            className="h-12 w-auto brightness-0 invert"
          />
          <p className="mt-6 text-center text-sm leading-relaxed text-[#A8BBCF] max-w-xs">
            Construction project and commissioning workspace.
          </p>
        </div>

        {/* Right — login panel */}
        <div className="flex flex-1 flex-col items-center justify-center bg-white px-8">
          {/* Logo shown only on small screens where left panel is hidden */}
          <img
            src="/datumgrid-logo.svg"
            alt="DatumGrid"
            className="mb-10 h-9 w-auto lg:hidden"
          />

          <div className="w-full max-w-sm">
            <h1 className="mb-2 text-2xl font-semibold text-[#1F2937]">Welcome back</h1>
            <p className="mb-8 text-sm text-[#6B7280]">Sign in to your DatumGrid account.</p>

            <div className="flex flex-col gap-3">
              <a
                href="/auth/login"
                className="flex items-center justify-center rounded-lg bg-[#4A90E2] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3a7fd4]"
              >
                Log in
              </a>
              <a
                href="/auth/login?screen_hint=signup"
                className="flex items-center justify-center rounded-lg border border-[#E5EAF2] bg-white px-5 py-3 text-sm font-semibold text-[#1F2937] transition hover:bg-[#F7F9FC]"
              >
                Create an account
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const projects = await getProjects();

  return (
    <div className="p-6">
      {projects.length === 0 ? (
        <p className="text-gray-500">No projects yet.</p>
      ) : (
        <ProjectsTable projects={projects} />
      )}
    </div>
  );
}
