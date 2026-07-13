import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ProjectFolder from "@/models/ProjectFolder";

type RouteParams = { params: Promise<{ projectId: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { projectId } = await params;
  await connectDB();
  const folders = await ProjectFolder.find({ projectId }).sort({ createdAt: 1 }).lean();
  return NextResponse.json({
    folders: folders.map((f) => ({
      _id: (f._id as { toString(): string }).toString(),
      folderId: f.folderId,
      folderName: f.folderName,
      folderUrl: f.folderUrl,
    })),
  });
}

export async function POST(req: Request, { params }: RouteParams) {
  const { projectId } = await params;
  await connectDB();
  const { folderId, folderName, folderUrl } = await req.json() as {
    folderId: string;
    folderName: string;
    folderUrl?: string;
  };

  // Prevent duplicates
  const existing = await ProjectFolder.findOne({ projectId, folderId });
  if (existing) {
    return NextResponse.json({ error: "Folder already linked." }, { status: 409 });
  }

  const folder = await ProjectFolder.create({ projectId, folderId, folderName, folderUrl: folderUrl ?? "" });
  return NextResponse.json({
    folder: {
      _id: folder._id.toString(),
      folderId: folder.folderId,
      folderName: folder.folderName,
      folderUrl: folder.folderUrl,
    },
  }, { status: 201 });
}
