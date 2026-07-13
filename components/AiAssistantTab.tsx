"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

type Message = { role: "user" | "assistant"; content: string };

const MODELS = [
  { value: "gemini-3.1-flash-lite", label: "3.1 Flash-Lite", desc: "Fastest answers" },
  { value: "gemini-3.5-flash",      label: "3.5 Flash",      desc: "All-around help" },
  { value: "gemini-3.1-pro",        label: "3.1 Pro",        desc: "Advanced math and code" },
  { value: "gemini-3.5-pro",        label: "Extended thinking", desc: "Complex problem solving" },
];

const DEFAULT_MODEL = MODELS[1].value; // 3.5 Flash

const SUGGESTIONS = [
  { icon: "📋", label: "Analyze project specs" },
  { icon: "💰", label: "Budget insights" },
  { icon: "📝", label: "Write a report" },
  { icon: "📅", label: "Plan the schedule" },
  { icon: "🔍", label: "Review documents" },
];

function DatumGridMark({ size = 22, fill = "#1C2E4A" }: { size?: number; fill?: string }) {
  return (
    <svg width={size} height={size} viewBox="400 850 285 295" fill={fill} className="shrink-0" aria-hidden>
      <polygon points="566.72,947.45 547.06,926.76 474.22,996.02 473.93,996.29 473.85,996.37 523.44,1048.54 543.45,1069.58 544.02,1069.04 616.66,999.98 595.61,977.84 595.32,977.54 588.53,970.34 588.54,970.33 574.38,955.38 560.04,969.14 553.35,975.55 567.52,990.5 574.02,984.26 588.57,999.27 581.86,1005.66 544.16,1041.49 501.94,997.08 546.35,954.85 552.37,961.2 554.08,959.57" />
      <rect x="533.85" y="986.77" transform="matrix(0.7247 -0.689 0.689 0.7247 -537.6822 650.4631)" width="22.81" height="22.81" />
      <polygon points="548.64,864.12 440.13,967.29 439.95,967.47 459.19,987.78 547.63,903.71 639.71,1000.56 551.09,1084.77 570.38,1105.11 571.15,1104.36 679.31,1001.56" />
      <polygon points="427.74,979.07 407.45,998.32 537.89,1135.88 541.82,1132.16 541.87,1132.22 558.21,1116.68 427.77,979.04" />
    </svg>
  );
}

function MarkdownText({ text }: { text: string }) {
  return <div className="text-[15px] leading-relaxed" style={{ whiteSpace: "pre-wrap" }}>{text}</div>;
}

function ModelPicker({
  model,
  onChange,
}: {
  model: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = MODELS.find((m) => m.value === model) ?? MODELS[1];

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-[#E5EAF2] bg-[#F7F9FC] px-3 py-1 text-xs font-medium text-[#374151] hover:border-[#4A90E2] hover:bg-white transition-colors"
      >
        {active.label}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-56 overflow-hidden rounded-xl border border-[#E5EAF2] bg-white shadow-lg">
          {MODELS.map((m, i) => (
            <React.Fragment key={m.value}>
              {i > 0 && <div className="mx-3 border-t border-[#E5EAF2]" />}
              <button
                type="button"
                onClick={() => { onChange(m.value); setOpen(false); }}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#F7F9FC] ${
                  m.value === model ? "bg-[#EBF3FF]" : ""
                }`}
              >
                <span className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${
                  m.value === model
                    ? "border-[#4A90E2] bg-[#4A90E2]"
                    : "border-[#D1D5DB] bg-white"
                }`} />
                <div>
                  <p className={`text-sm font-semibold ${m.value === model ? "text-[#1C2E4A]" : "text-[#1F2937]"}`}>
                    {m.label}
                  </p>
                  <p className="text-xs text-[#6B7280]">{m.desc}</p>
                </div>
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

function InputBox({
  value,
  onChange,
  onKeyDown,
  onSend,
  loading,
  placeholder,
  rows,
  model,
  onModelChange,
  textareaRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  loading: boolean;
  placeholder: string;
  rows: number;
  model: string;
  onModelChange: (v: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  return (
    <div className="rounded-2xl border border-[#E5EAF2] bg-white px-4 pt-4 pb-3 shadow-sm">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-none bg-transparent text-[15px] text-[#1F2937] placeholder-[#9CA3AF] outline-none leading-relaxed"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <ModelPicker model={model} onChange={onModelChange} />
        <button
          type="button"
          disabled={!value.trim() || loading}
          onClick={onSend}
          aria-label="Send"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1C2E4A] text-white transition-opacity hover:opacity-80 disabled:opacity-25"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4l8 8h-6v8h-4v-8H4z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function AiAssistantTab({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Restore last-used model from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("dg_ai_model");
    if (saved && MODELS.some((m) => m.value === saved)) setModel(saved);
  }, []);

  function changeModel(v: string) {
    setModel(v);
    localStorage.setItem("dg_ai_model", v);
  }

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 192)}px`;
  }, [input]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
      setInput("");
      setLoading(true);
      try {
        const res = await fetch("/api/ai-assistant/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, projectId, history: messages, model }),
        });
        const data: { text?: string; error?: string } = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.text ?? data.error ?? "An error occurred." },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Failed to connect to AI assistant." },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, model, projectId]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col bg-[#F7F9FC] -m-8" style={{ minHeight: "calc(100vh - 11rem)" }}>
      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-20">
          <div className="flex flex-col items-center gap-4">
            <DatumGridMark size={56} fill="#1C2E4A" />
            <h1 className="text-[2rem] font-medium text-[#1C2E4A] tracking-tight">
              How can I help you today?
            </h1>
          </div>

          <div className="w-full max-w-2xl">
            <InputBox
              value={input}
              onChange={setInput}
              onKeyDown={handleKeyDown}
              onSend={() => void sendMessage(input)}
              loading={loading}
              placeholder="Ask anything about your project…"
              rows={2}
              model={model}
              onModelChange={changeModel}
              textareaRef={textareaRef}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {SUGGESTIONS.map(({ icon, label }) => (
              <button
                key={label}
                type="button"
                onClick={() => void sendMessage(label)}
                className="flex items-center gap-2 rounded-full border border-[#E5EAF2] bg-white px-4 py-2 text-sm text-[#374151] shadow-sm transition-colors hover:border-[#4A90E2] hover:text-[#1C2E4A]"
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto py-8">
            <div className="mx-auto max-w-2xl space-y-6 px-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && <DatumGridMark size={22} fill="#1C2E4A" />}
                  <div className={`max-w-xl ${
                    msg.role === "user"
                      ? "rounded-2xl border border-[#E5EAF2] bg-white px-4 py-3 text-[#1F2937] shadow-sm"
                      : "text-[#1F2937]"
                  }`}>
                    <MarkdownText text={msg.content} />
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-3">
                  <DatumGridMark size={22} fill="#1C2E4A" />
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#4A90E2]" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#4A90E2]" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#4A90E2]" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t border-[#E5EAF2] bg-[#F7F9FC] py-4">
            <div className="mx-auto max-w-2xl px-4">
              <InputBox
                value={input}
                onChange={setInput}
                onKeyDown={handleKeyDown}
                onSend={() => void sendMessage(input)}
                loading={loading}
                placeholder="Reply… (Shift+Enter for new line)"
                rows={1}
                model={model}
                onModelChange={changeModel}
                textareaRef={textareaRef}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
