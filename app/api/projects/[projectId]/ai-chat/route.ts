import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AiChatMessage from "@/models/AiChatMessage";

type RouteParams = { params: Promise<{ projectId: string }> };
type ChatRole = "user" | "assistant";
type ChatRequestBody = {
  role: ChatRole;
  content: string;
  attachments?: { name: string; mimeType: string }[];
  scheduleData?: unknown;
  savedFiles?: unknown;
};

export async function GET(_req: Request, { params }: RouteParams) {
  const { projectId } = await params;
  await connectDB();

  const messages = await AiChatMessage.find({ projectId })
    .sort({ createdAt: 1 })
    .lean();

  return NextResponse.json({
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
      attachments: m.attachments?.length
        ? (m.attachments as { name: string; mimeType: string }[]).map((a) => ({ name: a.name, mimeType: a.mimeType }))
        : undefined,
      scheduleData: m.scheduleData ?? null,
      savedFiles: m.savedFiles ?? null,
    })),
  });
}

export async function POST(req: Request, { params }: RouteParams) {
  const { projectId } = await params;
  await connectDB();

  const body = (await req.json()) as Partial<ChatRequestBody>;

  if (body.role !== "user" && body.role !== "assistant") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const msg = await AiChatMessage.create({
    projectId,
    role: body.role,
    content: body.content ?? "",
    attachments: body.attachments ?? [],
    scheduleData: body.scheduleData ?? null,
    savedFiles: body.savedFiles ?? null,
  });

  return NextResponse.json({ id: msg._id.toString() }, { status: 201 });
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { projectId } = await params;
  await connectDB();
  await AiChatMessage.deleteMany({ projectId });
  return NextResponse.json({ ok: true });
}
