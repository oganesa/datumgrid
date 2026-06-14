import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { HeaderTitleProvider } from "@/components/HeaderTitleContext";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { auth0, isAuth0Configured } from "@/lib/auth0";


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
    icon: "/favicon.svg",
    apple: "/datumgrid-logo.svg",
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

  const isAuthenticated = !!session;

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {isAuthenticated ? (
          <div className="flex bg-white">
            <Sidebar userLabel={userLabel} />
            <div className="flex-1 ml-64 flex min-h-screen flex-col">
              <HeaderTitleProvider>
                <Header />
                <main className="flex-1 bg-[#F7F9FC] p-8">{children}</main>
              </HeaderTitleProvider>
            </div>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}