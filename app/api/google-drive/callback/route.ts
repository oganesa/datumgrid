import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import AppSettings from "@/models/AppSettings";
import GoogleDriveConnection from "@/models/GoogleDriveConnection";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const settingsUrl = `${origin}/settings?section=documents`;

  if (error) {
    return NextResponse.redirect(`${settingsUrl}&gdrive_error=${encodeURIComponent(error)}`);
  }

  // Verify CSRF state
  const cookieStore = await cookies();
  const savedState = cookieStore.get("gdrive_oauth_state")?.value;
  cookieStore.delete("gdrive_oauth_state");

  if (!state || state !== savedState) {
    return NextResponse.redirect(`${settingsUrl}&gdrive_error=invalid_state`);
  }
  if (!code) {
    return NextResponse.redirect(`${settingsUrl}&gdrive_error=no_code`);
  }

  await connectDB();
  const settings = await AppSettings.findOne().lean() as Record<string, string> | null;

  const clientId =
    process.env.GOOGLE_CLIENT_ID?.trim() ||
    (settings?.googleClientId as string | undefined)?.trim() || "";
  const clientSecret =
    process.env.GOOGLE_CLIENT_SECRET?.trim() ||
    (settings?.googleClientSecret as string | undefined)?.trim() || "";
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI?.trim() ||
    `${origin}/api/google-drive/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${settingsUrl}&gdrive_error=missing_credentials`);
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const errBody = await tokenRes.text();
    console.error("Google token exchange failed:", errBody);
    return NextResponse.redirect(`${settingsUrl}&gdrive_error=token_exchange_failed`);
  }

  const tokens = await tokenRes.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  // Fetch user email
  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const userInfo = userRes.ok
    ? (await userRes.json() as { email?: string })
    : { email: "" };

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  await GoogleDriveConnection.findOneAndUpdate(
    {},
    {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? "",
      expiresAt,
      userEmail: userInfo.email ?? "",
      connected: true,
    },
    { upsert: true, new: true }
  );

  return NextResponse.redirect(`${settingsUrl}&gdrive_connected=1`);
}
