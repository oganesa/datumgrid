import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { HeaderTitleProvider } from "@/components/HeaderTitleContext";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { auth0, isAuth0Configured } from "@/lib/auth0";
import { getAppSettings, toSidebarFeatureFlags } from "@/lib/app-settings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DatumGrid",
  description: "Construction project and commissioning workspace.",
  icons: {
    icon: "/datumgrid-logo.png",
    apple: "/datumgrid-logo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = isAuth0Configured() ? await auth0.getSession() : null;
  const userLabel =
    session?.user?.name ?? session?.user?.email ?? undefined;

  let featureFlags = {
    tasks: true,
    budgets: true,
    risksIssueLog: true,
    changeManagement: true,
    rfi: true,
    submittals: true,
    punchList: true,
  };
  try {
    const appSettings = await getAppSettings();
    featureFlags = toSidebarFeatureFlags(appSettings);
  } catch {
    /* Mongo unavailable — keep all modules visible */
  }

  return (
    <html lang="en">
      {/* Apply the geist fonts to the body class list */}
      <body className={`${geistSans.variable} ${geistMono.variable} flex bg-white antialiased`}>
        <Sidebar userLabel={userLabel} featureFlags={featureFlags} />
        <div className="flex-1 ml-64 flex min-h-screen flex-col">
          <HeaderTitleProvider>
            <Header />
            <main className="flex-1 bg-[#D5D5D5]/20 p-8">{children}</main>
          </HeaderTitleProvider>
        </div>
      </body>
    </html>
  );
}