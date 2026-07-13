import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AppSettings from "@/models/AppSettings";
import GoogleDriveConnection from "@/models/GoogleDriveConnection";

export async function GET() {
  await connectDB();

  const [connection, settings] = await Promise.all([
    GoogleDriveConnection.findOne().lean() as Promise<{
      connected?: boolean;
      userEmail?: string;
      expiresAt?: Date;
    } | null>,
    AppSettings.findOne().lean() as Promise<Record<string, string> | null>,
  ]);

  const clientId =
    process.env.GOOGLE_CLIENT_ID?.trim() ||
    (settings?.googleClientId as string | undefined)?.trim() ||
    "";

  const configured = Boolean(clientId);

  if (!connection?.connected) {
    return NextResponse.json({ connected: false, configured });
  }

  return NextResponse.json({
    connected: true,
    configured: true,
    userEmail: connection.userEmail ?? "",
    expiresAt: connection.expiresAt ? connection.expiresAt.toISOString() : null,
  });
}

export async function DELETE() {
  await connectDB();
  await GoogleDriveConnection.findOneAndUpdate(
    {},
    { accessToken: "", refreshToken: "", userEmail: "", connected: false, expiresAt: null },
    { upsert: false }
  );
  return NextResponse.json({ ok: true });
}
