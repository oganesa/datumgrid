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
