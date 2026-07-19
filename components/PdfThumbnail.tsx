"use client";

import { useEffect, useRef, useState } from "react";

type Status = "idle" | "loading" | "done" | "error";

type Props = {
  url: string;
  containerHeight: number;
};

export default function PdfThumbnail({ url, containerHeight }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    let cancelled = false;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    // Lazy-load: only render when the card scrolls into view
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          render();
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(wrapper);

    async function render() {
      if (cancelled) return;
      setStatus("loading");
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

        const pdf = await pdfjsLib.getDocument(url).promise;
        if (cancelled) return;

        const page = await pdf.getPage(1);
        if (cancelled) return;

        const canvas = canvasRef.current;
        const container = wrapperRef.current;
        if (!canvas || !container) return;

        const containerWidth = container.clientWidth || 200;
        const naturalViewport = page.getViewport({ scale: 1 });

        // Scale to fit the entire page inside the card (contain behaviour)
        const scaleW = containerWidth / naturalViewport.width;
        const scaleH = containerHeight / naturalViewport.height;
        const scale = Math.min(scaleW, scaleH);

        const viewport = page.getViewport({ scale });
        const dpr = window.devicePixelRatio || 1;

        canvas.width = viewport.width * dpr;
        canvas.height = viewport.height * dpr;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.scale(dpr, dpr);

        await page.render({ canvasContext: ctx, viewport }).promise;
        if (!cancelled) setStatus("done");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [url, containerHeight]);

  return (
    <div
      ref={wrapperRef}
      className="flex h-full w-full items-center justify-center bg-gray-50"
    >
      {(status === "idle" || status === "loading") && (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-orange-400" />
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-1 text-gray-300">
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z" />
          </svg>
          <span className="text-[10px]">PDF</span>
        </div>
      )}

      <canvas
        ref={canvasRef}
        style={{ display: status === "done" ? "block" : "none" }}
      />
    </div>
  );
}
