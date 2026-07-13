import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth0, isAuth0Configured } from "@/lib/auth0";
import { getAppSettings } from "@/lib/app-settings";

export const maxDuration = 120;

const SYSTEM_INSTRUCTION =
  "You are DatumGrid AI, an expert assistant for construction project management, commissioning, and engineering. " +
  "Help users with project planning, budget analysis, specification review, report writing, schedule planning, and technical questions. " +
  "Be concise, practical, and professional. Use markdown formatting for structured responses.\n\n" +
  "SCHEDULE GENERATION: When a user asks you to generate, create, plan, or build a project schedule, you MUST include a schedule-json code block in your response. " +
  "First write a brief explanation (1-3 sentences), then output the code block below. Use this EXACT format:\n\n" +
  "```schedule-json\n" +
  '{"tasks":[{"id":"t1","taskName":"Phase Name","outlineLevel":0,"duration":14,"isMilestone":false,"predecessors":[]},{"id":"t2","taskName":"Sub-task","outlineLevel":1,"duration":5,"isMilestone":false,"predecessors":[{"id":"t1","type":"FS","lag":0}]}]}\n' +
  "```\n\n" +
  "Rules for schedule-json:\n" +
  "- id: sequential strings t1, t2, t3 ...\n" +
  "- taskName: clear professional name\n" +
  "- outlineLevel: 0=phase/summary, 1=task under nearest preceding level-0, 2=sub-task under nearest preceding level-1\n" +
  "- duration: working days; set 0 and isMilestone:true for milestones\n" +
  "- predecessors: array of {id,type,lag} — type is FS/SS/FF/SF, lag in days (usually 0)\n" +
  "- Include realistic phases: planning, design, procurement, construction, testing/commissioning, closeout\n" +
  "- Use industry-standard construction durations\n" +
  "- ALWAYS output the schedule-json block when asked to create a schedule — never skip it.\n\n" +
  "FILE CLASSIFICATION: When the user attaches files AND the message includes a [LINKED FOLDERS] section, " +
  "you MUST analyze each file and decide which folder it belongs in. " +
  "Output a file-save-json code block AFTER your explanation. Use this EXACT format:\n\n" +
  "```file-save-json\n" +
  '[{"fileIndex":0,"folderId":"FOLDER_ID","folderName":"Folder Name","reason":"One sentence why this folder fits"}]\n' +
  "```\n\n" +
  "Rules for file-save-json:\n" +
  "- fileIndex: 0-based index of the attachment in the order they were sent\n" +
  "- folderId: MUST be an exact ID from the [LINKED FOLDERS] list — do not invent IDs\n" +
  "- Match files to folders based on file name, content, type (drawings→drawings folder, specs→specs folder, etc.)\n" +
  "- If a file doesn't match any folder clearly, pick the most general/appropriate one\n" +
  "- Always include ALL attached files in the array\n" +
  "- ALWAYS output the file-save-json block when files are attached and linked folders exist.";

export async function POST(req: Request) {
  if (isAuth0Configured()) {
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const dbSettings = await getAppSettings();
  const apiKey = process.env.GEMINI_API_KEY?.trim() || dbSettings.geminiApiKey.trim();

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Gemini API key is not configured. Go to Settings → AI Assistant to add your Google AI Studio key.",
      },
      { status: 503 }
    );
  }

  type AttachmentInput = { name: string; mimeType: string; data: string };
  type LinkedFolder = { folderId: string; folderName: string };
  let body: {
    message?: string;
    history?: { role: string; content: string }[];
    model?: string;
    attachments?: AttachmentInput[];
    linkedFolders?: LinkedFolder[];
    projectContext?: string; // pre-built folder structure text
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const message = body.message?.trim() ?? "";
  const attachments: AttachmentInput[] = Array.isArray(body.attachments) ? body.attachments : [];
  const linkedFolders: LinkedFolder[] = Array.isArray(body.linkedFolders) ? body.linkedFolders : [];
  const projectContext = body.projectContext?.trim() ?? "";

  if (!message && attachments.length === 0) {
    return NextResponse.json({ error: "Message or attachment is required." }, { status: 400 });
  }

  const history = Array.isArray(body.history) ? body.history : [];
  const modelName =
    body.model?.trim() ||
    process.env.GEMINI_MODEL?.trim() ||
    dbSettings.geminiModel.trim() ||
    "gemini-3.5-flash";

  const ai = new GoogleGenAI({ apiKey });

  // Append live project document context to system instruction
  const systemInstruction = projectContext
    ? `${SYSTEM_INSTRUCTION}\n\n${projectContext}`
    : SYSTEM_INSTRUCTION;

  // Build the latest user message parts (text + inline file data)
  const userParts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [];

  // When files are attached, append folder list so AI can classify
  let textWithContext = message;
  if (attachments.length > 0 && linkedFolders.length > 0) {
    const folderList = linkedFolders
      .map((f) => `  - "${f.folderName}" (id: ${f.folderId})`)
      .join("\n");
    const fileList = attachments.map((a, i) => `  [${i}] ${a.name} (${a.mimeType})`).join("\n");
    textWithContext =
      (message || "Please analyze and save these files.") +
      `\n\n[LINKED FOLDERS]\n${folderList}` +
      `\n\n[ATTACHED FILES]\n${fileList}`;
  }

  if (textWithContext) userParts.push({ text: textWithContext });
  for (const att of attachments) {
    userParts.push({ inlineData: { mimeType: att.mimeType, data: att.data } });
  }

  const contents = [
    ...history.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    })),
    { role: "user" as const, parts: userParts },
  ];

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config: { systemInstruction: systemInstruction },
    });
    const text = response.text ?? "No response from AI.";
    return NextResponse.json({ text });
  } catch (e: unknown) {
    console.error("ai-assistant/chat:", e);
    const msg = e instanceof Error ? e.message : "AI request failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
