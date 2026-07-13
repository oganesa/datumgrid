import { NextRequest, NextResponse } from "next/server";
import { getDriveAccessToken } from "@/lib/google-drive";

export async function POST(req: NextRequest) {
  const token = await getDriveAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Not connected to Google Drive." }, { status: 401 });
  }

  const { folderId, fileName, mimeType, data } = await req.json() as {
    folderId: string;
    fileName: string;
    mimeType: string;
    data: string; // base64
  };

  if (!folderId || !fileName || !data) {
    return NextResponse.json({ error: "folderId, fileName, and data are required." }, { status: 400 });
  }

  const boundary = "dg_boundary_" + Math.random().toString(36).slice(2);
  const metadata = JSON.stringify({ name: fileName, parents: [folderId] });

  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    metadata,
    `--${boundary}`,
    `Content-Type: ${mimeType || "application/octet-stream"}`,
    "Content-Transfer-Encoding: base64",
    "",
    data,
    `--${boundary}--`,
  ].join("\r\n");

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary="${boundary}"`,
      },
      body,
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("[google-drive/upload]", res.status, err);
    if (res.status === 401 || res.status === 403) {
      return NextResponse.json(
        { error: "insufficient_scope", message: "Google Drive write permission not granted. Please reconnect Google Drive in Settings → Documents." },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: `Drive upload failed: ${res.status}`, message: err }, { status: 502 });
  }

  const file = await res.json() as { id: string; name: string; webViewLink: string };
  return NextResponse.json({ file });
}
