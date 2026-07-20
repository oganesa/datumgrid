import { connectDB } from "@/lib/mongodb";
import AppSettings from "@/models/AppSettings";
import GoogleDriveConnection from "@/models/GoogleDriveConnection";

export interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
  iconLink?: string;
}

export const FOLDER_MIME = "application/vnd.google-apps.folder";

/** Returns a valid access token, refreshing if needed. Returns null if not connected. */
export async function getDriveAccessToken(): Promise<string | null> {
  await connectDB();

  const connection = await GoogleDriveConnection.findOne().lean() as {
    connected?: boolean;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
  } | null;

  if (!connection?.connected || !connection.accessToken) return null;

  // Token still valid (5-min buffer)
  if (connection.expiresAt && connection.expiresAt.getTime() > Date.now() + 5 * 60 * 1000) {
    return connection.accessToken;
  }

  // Refresh
  if (!connection.refreshToken) return null;

  const settings = await AppSettings.findOne().lean() as Record<string, string> | null;
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() || settings?.googleClientId || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || settings?.googleClientSecret || "";

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: connection.refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) return null;

  const tokens = await res.json() as { access_token: string; expires_in: number };
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  await GoogleDriveConnection.findOneAndUpdate(
    {},
    { accessToken: tokens.access_token, expiresAt }
  );

  return tokens.access_token;
}

/** List items inside a Drive folder (folders first, then files).
 *  Pass folderId="sharedWithMe" to list shared folders. */
export async function listDriveFolder(
  folderId: string,
  accessToken: string,
  foldersOnly = false
): Promise<DriveItem[]> {
  const mimeFilter = foldersOnly ? `mimeType='${FOLDER_MIME}'` : "";

  let parentFilter: string;
  if (folderId === "sharedWithMe") {
    parentFilter = "sharedWithMe=true and trashed=false";
  } else {
    parentFilter = `'${folderId}' in parents and trashed=false`;
  }

  const q = mimeFilter ? `${mimeFilter} and ${parentFilter}` : parentFilter;

  const params = new URLSearchParams({
    q,
    fields: "files(id,name,mimeType,modifiedTime,size,webViewLink,iconLink)",
    orderBy: "folder,name",
    pageSize: "200",
  });

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Drive API ${res.status}: ${errBody}`);
  }
  const data = await res.json() as { files: DriveItem[] };
  return data.files ?? [];
}

/** Get metadata for a single Drive item. */
export async function getDriveItem(id: string, accessToken: string): Promise<DriveItem | null> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${id}?fields=id,name,mimeType,modifiedTime,size,webViewLink`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return null;
  return res.json() as Promise<DriveItem>;
}

/** Create a subfolder inside a parent Drive folder. */
export async function createDriveFolder(
  name: string,
  parentFolderId: string,
  accessToken: string
): Promise<DriveItem> {
  const res = await fetch(
    "https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType,modifiedTime,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        mimeType: FOLDER_MIME,
        parents: [parentFolderId],
      }),
    }
  );
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Drive API ${res.status}: ${errBody}`);
  }
  return res.json() as Promise<DriveItem>;
}

/** Find a direct child folder by exact name, or null if none exists. */
export async function findChildFolder(
  parentFolderId: string,
  name: string,
  accessToken: string
): Promise<DriveItem | null> {
  const escapedName = name.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  const q = `name='${escapedName}' and '${parentFolderId}' in parents and mimeType='${FOLDER_MIME}' and trashed=false`;
  const params = new URLSearchParams({
    q,
    fields: "files(id,name,mimeType,modifiedTime,webViewLink)",
    pageSize: "1",
  });
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Drive API ${res.status}: ${errBody}`);
  }
  const data = await res.json() as { files: DriveItem[] };
  return data.files?.[0] ?? null;
}

/** Upload a file's bytes into a Drive folder via multipart upload. */
export async function uploadFileToDrive(params: {
  folderId: string;
  fileName: string;
  mimeType: string;
  data: Buffer;
  accessToken: string;
}): Promise<{ id: string; name: string; webViewLink?: string }> {
  const { folderId, fileName, mimeType, data, accessToken } = params;

  const boundary = "dg_boundary_" + Math.random().toString(36).slice(2);
  const metadata = JSON.stringify({ name: fileName, parents: [folderId] });
  const base64Data = data.toString("base64");

  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    metadata,
    `--${boundary}`,
    `Content-Type: ${mimeType || "application/octet-stream"}`,
    "Content-Transfer-Encoding: base64",
    "",
    base64Data,
    `--${boundary}--`,
  ].join("\r\n");

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary="${boundary}"`,
      },
      body,
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive upload failed: ${res.status}: ${err}`);
  }

  return res.json() as Promise<{ id: string; name: string; webViewLink?: string }>;
}

/** Download a file's raw bytes from Drive. */
export async function downloadFileFromDrive(fileId: string, accessToken: string): Promise<Buffer> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Drive download failed: ${res.status}: ${errBody}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

/** Delete a file from Drive. A 404 (already gone) is treated as success. */
export async function deleteDriveFile(fileId: string, accessToken: string): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok && res.status !== 404) {
    const errBody = await res.text();
    throw new Error(`Drive delete failed: ${res.status}: ${errBody}`);
  }
}
