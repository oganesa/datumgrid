"use client";

import { useState, useTransition } from "react";
import { saveAiSettings } from "@/actions/appSettingsActions";

type Props = {
  initialKey: string;
  initialModel: string;
};

export default function AiAssistantSettings({ initialKey, initialModel }: Props) {
  const [apiKey, setApiKey] = useState(initialKey);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isDirty = apiKey !== initialKey;

  function handleSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveAiSettings(apiKey, initialModel);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  const maskedPlaceholder = initialKey
    ? `${initialKey.slice(0, 6)}${"•".repeat(Math.min(initialKey.length - 6, 24))}`
    : "";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#1C2E4A]">AI Assistant</h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          Connect Google Gemini to power the AI Assistant tab in your projects.
        </p>
      </div>

      <div className="rounded-xl border border-[#E5EAF2] bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-[#E5EAF2] px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F7F9FC]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.5 9 2 10.5 2 12c0 1.5 4.5 3 10 10 5.5-7 10-8.5 10-10 0-1.5-4.5-3-10-10z" fill="#4285F4"/>
              <path d="M12 2c5.5 7 10 8.5 10 10 0 1.5-4.5 3-10 10V2z" fill="#34A853" opacity=".7"/>
              <path d="M12 22C6.5 15 2 13.5 2 12c0-1.5 4.5-3 10-10v20z" fill="#FBBC05" opacity=".7"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1C2E4A]">Google Gemini</p>
            <p className="text-xs text-[#6B7280]">Text generation · Chat</p>
          </div>
          <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium ${
            initialKey
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-[#F7F9FC] text-[#6B7280] border border-[#E5EAF2]"
          }`}>
            {initialKey ? "Connected" : "Not configured"}
          </span>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#1F2937]">API Key</label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); setSaved(false); }}
                placeholder={maskedPlaceholder || "Paste your Gemini API key…"}
                className="w-full rounded-lg border border-[#E5EAF2] bg-[#F7F9FC] px-4 py-2.5 pr-20 text-sm text-[#1F2937] placeholder-[#9CA3AF] outline-none focus:border-[#4A90E2] focus:bg-white transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#4A90E2] hover:text-[#1C2E4A]"
              >
                {showKey ? "Hide" : "Show"}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-[#6B7280]">
              Get your free API key at{" "}
              <span className="font-medium text-[#4A90E2]">aistudio.google.com</span>
              {" "}→ Get API key.
            </p>
          </div>

          <div className="rounded-lg bg-[#F0F7FF] border border-[#BFDBFE] px-4 py-3 text-xs text-[#1e40af] leading-relaxed">
            Model selection is available inside the chat — use the dropdown in the message input to switch between Gemini 3.1 Flash-Lite, 3.5 Flash, 3.1 Pro, and Extended thinking.
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}
          {saved && !isDirty && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">
              API key saved successfully.
            </div>
          )}
        </div>

        <div className="flex items-center justify-end border-t border-[#E5EAF2] px-6 py-4">
          <button
            type="button"
            disabled={!isDirty || pending}
            onClick={handleSave}
            className="rounded-lg bg-[#1C2E4A] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-30"
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
