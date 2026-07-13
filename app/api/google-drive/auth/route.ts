import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import AppSettings from "@/models/AppSettings";

export async function GET(req: NextRequest) {
  await connectDB();
  const settings = await AppSettings.findOne().lean() as Record<string, string> | null;

  const clientId =
    process.env.GOOGLE_CLIENT_ID?.trim() ||
    (settings?.googleClientId as string | undefined)?.trim() ||
    "";

  // Auto-derive redirect URI from the incoming request origin
  const origin = new URL(req.url).origin;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI?.trim() ||
    `${origin}/api/google-drive/callback`;

  const settingsUrl = `${origin}/settings?section=documents`;

  if (!clientId) {
    return NextResponse.redirect(
      `${settingsUrl}&gdrive_error=missing_client_id`
    );
  }

  // CSRF state token
  const state = crypto.randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("gdrive_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
