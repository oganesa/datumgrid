import fs from "fs/promises";
import { Types } from "mongoose";

import {
  createDriveFolder,
  deleteDriveFile,
  downloadFileFromDrive,
  findChildFolder,
  getDriveAccessToken,
  uploadFileToDrive,
} from "@/lib/google-drive";
import { planFileAbsolutePath } from "@/lib/plan-storage";
import Project from "@/models/Project";

const PLANS_FOLDER_NAME = "Plans";

export class StorageConfigError extends Error {
  code: "DRIVE_NOT_CONNECTED" | "NO_STORAGE_FOLDER";
  constructor(code: "DRIVE_NOT_CONNECTED" | "NO_STORAGE_FOLDER", message: string) {
    super(message);
    this.code = code;
  }
}

type ProjectStorageFields = {
  _id: Types.ObjectId | string;
  storageProvider?: string | null;
  storageFolderId?: string | null;
  storagePlansFolderId?: string | null;
};

type PlanFileRef = {
  storageProvider?: string | null;
  storageFileId?: string | null;
  storedFileName?: string | null;
};

/**
 * Returns the cached "Plans" subfolder id for a project, creating it (and
 * searching for a pre-existing one first, to avoid duplicates) on first use.
 */
export async function getOrCreatePlansFolderId(
  project: ProjectStorageFields
): Promise<string> {
  if (project.storagePlansFolderId) return project.storagePlansFolderId;

  if (project.storageProvider !== "google-drive" || !project.storageFolderId) {
    throw new StorageConfigError(
      "NO_STORAGE_FOLDER",
      "Choose a storage folder for this project before uploading plans."
    );
  }

  const token = await getDriveAccessToken();
  if (!token) {
    throw new StorageConfigError(
      "DRIVE_NOT_CONNECTED",
      "Connect Google Drive in Settings to upload plans."
    );
  }

  const existing = await findChildFolder(project.storageFolderId, PLANS_FOLDER_NAME, token);
  const folder =
    existing ?? (await createDriveFolder(PLANS_FOLDER_NAME, project.storageFolderId, token));

  await Project.findByIdAndUpdate(project._id, {
    $set: {
      storagePlansFolderId: folder.id,
      storagePlansFolderUrl: folder.webViewLink ?? "",
    },
  });

  return folder.id;
}

/** Uploads a plan PDF page into the project's connected cloud storage. */
export async function uploadPlanFile(
  project: { storageProvider?: string | null },
  plansFolderId: string,
  fileName: string,
  data: Buffer
): Promise<{ storageProvider: string; storageFileId: string; storageFileUrl: string }> {
  if (project.storageProvider === "google-drive") {
    const token = await getDriveAccessToken();
    if (!token) {
      throw new StorageConfigError(
        "DRIVE_NOT_CONNECTED",
        "Connect Google Drive in Settings to upload plans."
      );
    }
    const file = await uploadFileToDrive({
      folderId: plansFolderId,
      fileName,
      mimeType: "application/pdf",
      data,
      accessToken: token,
    });
    return {
      storageProvider: "google-drive",
      storageFileId: file.id,
      storageFileUrl: file.webViewLink ?? "",
    };
  }

  throw new StorageConfigError(
    "NO_STORAGE_FOLDER",
    "Choose a storage folder for this project before uploading plans."
  );
}

/** Reads a plan sheet's bytes from wherever it's stored (Drive, or legacy local disk). */
export async function downloadPlanFile(projectId: string, sheet: PlanFileRef): Promise<Buffer> {
  if (sheet.storageProvider === "google-drive") {
    if (!sheet.storageFileId) {
      throw new Error("Missing Drive file id.");
    }
    const token = await getDriveAccessToken();
    if (!token) {
      throw new StorageConfigError(
        "DRIVE_NOT_CONNECTED",
        "Connect Google Drive in Settings to view this file."
      );
    }
    return downloadFileFromDrive(sheet.storageFileId, token);
  }

  const absPath = planFileAbsolutePath(projectId, sheet.storedFileName ?? "");
  return fs.readFile(absPath);
}

/** Deletes a plan sheet's underlying file. Swallows "already gone" failures, matching legacy semantics. */
export async function deletePlanFile(projectId: string, sheet: PlanFileRef): Promise<void> {
  if (sheet.storageProvider === "google-drive") {
    if (!sheet.storageFileId) return;
    try {
      const token = await getDriveAccessToken();
      if (!token) return;
      await deleteDriveFile(sheet.storageFileId, token);
    } catch {
      // file may already be gone, or the Drive connection was revoked
    }
    return;
  }

  try {
    const absPath = planFileAbsolutePath(projectId, sheet.storedFileName ?? "");
    await fs.unlink(absPath);
  } catch {
    // file may already be gone
  }
}
