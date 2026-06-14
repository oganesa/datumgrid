"use client";

import { useState } from "react";

type Props = {
  equipmentSummary: string;
};

export default function AiVerificationPanel({ equipmentSummary }: Props) {
  const [manualText, setManualText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.set("manualText", manualText);
      form.set("equipmentSummary", equipmentSummary);
      for (const f of files) {
        form.append("images", f);
      }
      const res = await fetch("/api/commissioning/ai-verify", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? `Request failed (${res.status})`);
        return;
      }
      setResult(data.text ?? "");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Upload site photos and paste the relevant <strong>installation manual</strong>{" "}
        text (or excerpts). The app sends them to{" "}
        <strong>Google Gemini</strong> on the server—your API key stays in{" "}
        <code className="rounded bg-gray-100 px-1 text-xs">.env.local</code>, never in the
        browser.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label
            className="mb-1 block text-xs font-medium text-gray-700"
            htmlFor="manual-text"
          >
            Installation manual (text) — min 50 characters
          </label>
          <textarea
            id="manual-text"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            rows={10}
            required
            minLength={50}
            placeholder="Paste sections from the manufacturer installation / commissioning manual that apply to this equipment…"
            className="w-full rounded border border-[#E5EAF2] p-2 text-sm outline-none focus:border-[#4A90E2]"
          />
        </div>

        <div>
          <label
            className="mb-1 block text-xs font-medium text-gray-700"
            htmlFor="site-photos"
          >
            Site photos (JPEG, PNG, WebP, or GIF — up to 8 files, 4 MB each)
          </label>
          <input
            id="site-photos"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            required
            onChange={(e) =>
              setFiles(e.target.files ? Array.from(e.target.files) : [])
            }
            className="block w-full text-sm text-gray-700 file:mr-3 file:rounded file:border-0 file:bg-[#EBF3FF] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#4A90E2] hover:file:bg-[#cceeff]"
          />
          {files.length > 0 ? (
            <p className="mt-1 text-xs text-gray-500">
              {files.length} file{files.length === 1 ? "" : "s"} selected
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={loading || manualText.trim().length < 50 || files.length === 0}
          className="rounded-md bg-[#4A90E2] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#7FB3FF] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Running Gemini…" : "Run AI verification"}
        </button>
      </form>

      {error ? (
        <div
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
            Gemini result
          </h4>
          <pre className="whitespace-pre-wrap break-words font-sans text-sm text-gray-900">
            {result}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
