import { NextRequest, NextResponse } from "next/server";
import { getDriveAccessToken, listDriveFolder } from "@/lib/google-drive";

export async function GET(req: NextRequest) {
  const token = await getDriveAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Not connected to Google Drive." }, { status: 401 });
  }

  const folderId = new URL(req.url).searchParams.get("folderId");
  if (!folderId) return NextResponse.json({ error: "folderId required." }, { status: 400 });

  const items = await listDriveFolder(folderId, token, false);
  return NextResponse.json({ items });
}
