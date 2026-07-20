import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import Project from "@/models/Project";

type RouteParams = { params: Promise<{ projectId: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { projectId } = await params;
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return NextResponse.json({ error: "Invalid project id." }, { status: 400 });
  }

  await connectDB();
  const project = await Project.findById(projectId)
    .select("storageProvider storageFolderId storageFolderName storageFolderUrl storagePlansFolderId")
    .lean();

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const p = project as {
    storageProvider?: string | null;
    storageFolderId?: string | null;
    storageFolderName?: string | null;
    storageFolderUrl?: string | null;
    storagePlansFolderId?: string | null;
  };

  return NextResponse.json({
    storageProvider: p.storageProvider ?? null,
    storageFolderId: p.storageFolderId ?? null,
    storageFolderName: p.storageFolderName ?? null,
    storageFolderUrl: p.storageFolderUrl ?? null,
    storagePlansFolderId: p.storagePlansFolderId ?? null,
  });
}

export async function PUT(req: Request, { params }: RouteParams) {
  const { projectId } = await params;
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return NextResponse.json({ error: "Invalid project id." }, { status: 400 });
  }

  const { folderId, folderName, folderUrl } = (await req.json()) as {
    folderId?: string;
    folderName?: string;
    folderUrl?: string;
  };

  if (!folderId || !folderName) {
    return NextResponse.json({ error: "folderId and folderName are required." }, { status: 400 });
  }

  await connectDB();
  const project = await Project.findByIdAndUpdate(
    projectId,
    {
      $set: {
        storageProvider: "google-drive",
        storageFolderId: folderId,
        storageFolderName: folderName,
        storageFolderUrl: folderUrl ?? "",
        // Changing the root folder invalidates any cached "Plans" subfolder from the old root.
        storagePlansFolderId: null,
        storagePlansFolderUrl: null,
      },
    },
    { new: true }
  ).select("storageProvider storageFolderId storageFolderName storageFolderUrl");

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  return NextResponse.json({
    storageProvider: project.storageProvider,
    storageFolderId: project.storageFolderId,
    storageFolderName: project.storageFolderName,
    storageFolderUrl: project.storageFolderUrl,
  });
}
