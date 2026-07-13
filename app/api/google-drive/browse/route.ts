import { NextRequest, NextResponse } from "next/server";
import { getDriveAccessToken, listDriveFolder } from "@/lib/google-drive";

export async function GET(req: NextRequest) {
  const token = await getDriveAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Not connected to Google Drive." }, { status: 401 });
  }

  const folderId = new URL(req.url).searchParams.get("folderId") ?? "root";
  const foldersOnly = new URL(req.url).searchParams.get("foldersOnly") === "1";

  try {
    const items = await listDriveFolder(folderId, token, foldersOnly);
    return NextResponse.json({ items });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[google-drive/browse]", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
