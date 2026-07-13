import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
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
    icon: "/32-into-32--Navy-Favicon.png",
    apple: "/32-into-32--Navy-Favicon.png",
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
          <AppShell userLabel={userLabel}>{children}</AppShell>
        ) : (
          children
        )}
      </body>
    </html>
  );
}