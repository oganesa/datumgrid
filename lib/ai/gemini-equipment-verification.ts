import { GoogleGenerativeAI } from "@google/generative-ai";

export type ImagePartInput = { buffer: Buffer; mimeType: string };

/**
 * Sends site photos + installation manual text to Gemini (multimodal).
 * Requires `GEMINI_API_KEY` in the environment. Optional `GEMINI_MODEL` (default `gemini-2.0-flash`).
 */
export async function runEquipmentVisualVerification(options: {
  manualText: string;
  equipmentSummary: string;
  images: ImagePartInput[];
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const modelName =
    process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const prompt = `You are an experienced mechanical and electrical commissioning engineer.

The user has provided PHOTOS from a job site and the TEXT of a manufacturer installation manual (or key excerpts).

Your task:
1. Compare what is visible in the photos to the manual requirements when possible.
2. List items that appear correctly installed or aligned with the manual.
3. List deviations, missing steps, unclear situations, or anything that contradicts the manual.
4. Note safety-related concerns if visible.
5. If the images do not show enough detail to assess a manual requirement, say "not visible" for that point — do not invent site conditions.

Respond in clear Markdown with headings and bullet lists.

---

**Equipment record (context):**
${options.equipmentSummary}

---

**Installation manual / standard (verbatim):**
${options.manualText}
`;

  const imageParts = options.images.map((img) => ({
    inlineData: {
      mimeType: img.mimeType,
      data: img.buffer.toString("base64"),
    },
  }));

  const result = await model.generateContent([
    { text: prompt },
    ...imageParts,
  ]);

  const text = result.response.text();
  if (!text?.trim()) {
    return "The model returned an empty response. Try different images or shorten the manual text.";
  }
  return text;
}
