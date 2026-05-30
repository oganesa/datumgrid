import { NextResponse } from "next/server";

import { runEquipmentVisualVerification } from "@/lib/ai/gemini-equipment-verification";
import { auth0, isAuth0Configured } from "@/lib/auth0";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_FILES = 8;
const MAX_MANUAL_CHARS = 120_000;
const MAX_FILE_BYTES = 4 * 1024 * 1024;

export const maxDuration = 120;

export async function POST(req: Request) {
  if (!isAuth0Configured()) {
    return NextResponse.json(
      { error: "Authentication is not configured." },
      { status: 503 }
    );
  }

  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.GEMINI_API_KEY?.trim()) {
    return NextResponse.json(
      {
        error:
          "GEMINI_API_KEY is not set. Add your Google AI Studio key to .env.local to enable Gemini verification.",
      },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const manualText = String(form.get("manualText") ?? "").trim();
  if (manualText.length < 50) {
    return NextResponse.json(
      {
        error:
          "Paste at least 50 characters from the installation manual so the model has a baseline to compare against.",
      },
      { status: 400 }
    );
  }
  if (manualText.length > MAX_MANUAL_CHARS) {
    return NextResponse.json(
      { error: "Installation manual text is too long (max 120,000 characters)." },
      { status: 400 }
    );
  }

  const equipmentSummary =
    String(form.get("equipmentSummary") ?? "").trim() || "(no equipment summary)";

  const files = form.getAll("images").filter((v): v is File => v instanceof File);
  if (files.length === 0) {
    return NextResponse.json(
      { error: "Add at least one site photo." },
      { status: 400 }
    );
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `At most ${MAX_FILES} images per request.` },
      { status: 400 }
    );
  }

  const images: { buffer: Buffer; mimeType: string }[] = [];
  for (const file of files) {
    if (file.size === 0 || file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "Each image must be non-empty and under 4 MB." },
        { status: 400 }
      );
    }
    const mimeType = (file.type || "application/octet-stream").toLowerCase();
    if (!ALLOWED_MIME.has(mimeType)) {
      return NextResponse.json(
        {
          error: `Unsupported image type "${mimeType}". Use JPEG, PNG, WebP, or GIF.`,
        },
        { status: 400 }
      );
    }
    const buf = Buffer.from(await file.arrayBuffer());
    images.push({ buffer: buf, mimeType });
  }

  try {
    const text = await runEquipmentVisualVerification({
      manualText,
      equipmentSummary,
      images,
    });
    return NextResponse.json({ text });
  } catch (e: unknown) {
    console.error("commissioning/ai-verify:", e);
    const msg = e instanceof Error ? e.message : "Verification failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
