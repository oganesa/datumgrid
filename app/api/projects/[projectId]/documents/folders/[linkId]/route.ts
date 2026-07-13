import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ProjectFolder from "@/models/ProjectFolder";

type RouteParams = { params: Promise<{ projectId: string; linkId: string }> };

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { projectId, linkId } = await params;
  await connectDB();
  await ProjectFolder.deleteOne({ _id: linkId, projectId });
  return NextResponse.json({ ok: true });
}
