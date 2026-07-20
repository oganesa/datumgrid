import { NextRequest, NextResponse } from "next/server";
import { getDriveAccessToken, uploadFileToDrive } from "@/lib/google-drive";

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

  try {
    const file = await uploadFileToDrive({
      folderId,
      fileName,
      mimeType,
      data: Buffer.from(data, "base64"),
      accessToken: token,
    });
    return NextResponse.json({ file });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[google-drive/upload]", message);
    if (message.includes("401") || message.includes("403")) {
      return NextResponse.json(
        { error: "insufficient_scope", message: "Google Drive write permission not granted. Please reconnect Google Drive in Settings → Documents." },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: "Drive upload failed", message }, { status: 502 });
  }
}
