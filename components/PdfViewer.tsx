"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CalibrationPoint = { x: number; y: number };
type MeasurementPoint = { x: number; y: number };
type CalibrationState = {
  enabled: boolean;
  scale: number;
  unit: string;
  pointA: CalibrationPoint | null;
  pointB: CalibrationPoint | null;
};

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const SNAP_ANGLES = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345];
const SNAP_TOLERANCE = 12;

type Props = { url: string; sheetId?: string; projectId?: string };

export default function PdfViewer({ url, sheetId, projectId }: Props) {
  const outerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfPageRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeRenderRef = useRef<any>(null);
  // Keep zoom in a ref too so ResizeObserver always sees the current value
  const zoomRef = useRef(1);

  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [zoom, setZoomState] = useState(1);
  const [activeTool, setActiveTool] = useState<"linear" | "polyline" | "area" | "calibration" | null>(null);
  const calibrationRef = useRef<CalibrationState>({
    enabled: false,
    scale: 0,
    unit: "ft",
    pointA: null,
    pointB: null,
  });
  const [calibration, setCalibration] = useState<CalibrationState>({
    enabled: false,
    scale: 0,
    unit: "ft",
    pointA: null,
    pointB: null,
  });
  const [promptScale, setPromptScale] = useState(false);
  const [pendingScaleValue, setPendingScaleValue] = useState("");
  const [pendingScaleUnit, setPendingScaleUnit] = useState("ft");
  const [measurementPoints, setMeasurementPoints] = useState<MeasurementPoint[]>([]);

  useEffect(() => {
    calibrationRef.current = calibration;
  }, [calibration]);

  const setZoom = useCallback((updater: number | ((p: number) => number)) => {
    const next =
      typeof updater === "function" ? updater(zoomRef.current) : updater;
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(next * 100) / 100));
    zoomRef.current = clamped;
    setZoomState(clamped);
  }, []);

  const snapPointToAngle = useCallback((origin: MeasurementPoint, point: MeasurementPoint) => {
    const dx = point.x - origin.x;
    const dy = point.y - origin.y;
    const distance = Math.hypot(dx, dy);

    if (distance <= 2) {
      return { ...point, snapped: false };
    }

    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const normalized = (angle % 360 + 360) % 360;

    let bestAngle = normalized;
    let bestDelta = Number.POSITIVE_INFINITY;

    for (const candidate of SNAP_ANGLES) {
      const delta = Math.abs(((candidate - normalized + 540) % 360) - 180);
      if (delta < bestDelta) {
        bestDelta = delta;
        bestAngle = candidate;
      }
    }

    if (bestDelta <= SNAP_TOLERANCE) {
      const radians = (bestAngle * Math.PI) / 180;
      return {
        x: origin.x + Math.cos(radians) * distance,
        y: origin.y + Math.sin(radians) * distance,
        snapped: true,
      };
    }

    return { ...point, snapped: false };
  }, []);

  const doRender = useCallback((zoomLevel: number) => {
    const page = pdfPageRef.current;
    const canvas = canvasRef.current;
    const outer = outerRef.current;
    if (!page || !canvas || !outer) return;

    const w = outer.clientWidth;
    const h = outer.clientHeight;
    if (w === 0 || h === 0) return;

    const natural = page.getViewport({ scale: 1 });
    const pad = 48;
    const fitScale = Math.min(
      (w - pad * 2) / natural.width,
      (h - pad * 2) / natural.height
    );
    const scale = fitScale * zoomLevel;
    const viewport = page.getViewport({ scale });
    const dpr = window.devicePixelRatio || 1;

    canvas.width = viewport.width * dpr;
    canvas.height = viewport.height * dpr;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    if (activeRenderRef.current) {
      try { activeRenderRef.current.cancel(); } catch { /* ignore */ }
    }
    const task = page.render({ canvasContext: ctx, viewport });
    activeRenderRef.current = task;
    task.promise
      .then(() => {
        ctx.save();
        ctx.strokeStyle = "#4A90E2";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);

        if (calibration.pointA) {
          const a = calibration.pointA;
          ctx.beginPath();
          ctx.arc(a.x, a.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = "#4A90E2";
          ctx.fill();
          if (calibration.pointB) {
            const b = calibration.pointB;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        if (measurementPoints.length > 0) {
          ctx.setLineDash([]);
          ctx.beginPath();
          measurementPoints.forEach((point, index) => {
            if (index === 0) {
              ctx.moveTo(point.x, point.y);
            } else {
              ctx.lineTo(point.x, point.y);
            }
          });
          ctx.stroke();
          measurementPoints.forEach((point) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = "#FF8A00";
            ctx.fill();
          });
        }

        ctx.restore();
        setStatus("done");
      })
      .catch(() => { /* cancelled */ });
  }, [calibration, measurementPoints]);

  // Load PDF once
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    async function load() {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
        const pdf = await pdfjsLib.getDocument(url).promise;
        if (cancelled) return;
        const page = await pdf.getPage(1);
        if (cancelled) return;
        pdfPageRef.current = page;
        doRender(zoomRef.current);
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    // Re-render on container resize
    const ro = new ResizeObserver(() => {
      if (pdfPageRef.current) doRender(zoomRef.current);
    });
    if (outerRef.current) ro.observe(outerRef.current);

    load();
    return () => {
      cancelled = true;
      ro.disconnect();
      if (activeRenderRef.current) {
        try { activeRenderRef.current.cancel(); } catch { /* ignore */ }
      }
    };
  }, [url, doRender]);

  // Re-render whenever zoom or drawing state changes
  useEffect(() => {
    if (pdfPageRef.current) doRender(zoom);
  }, [zoom, doRender]);

  // Mouse-wheel zoom (no page scroll — preventDefault)
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const dir = e.deltaY < 0 ? 1 : -1;
      setZoom((p) => p + dir * 0.1);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [setZoom]);

  const zoomIn  = () => setZoom((p) => p + 0.25);
  const zoomOut = () => setZoom((p) => p - 0.25);

  const resetCalibration = useCallback(() => {
    setCalibration({
      enabled: false,
      scale: 0,
      unit: "ft",
      pointA: null,
      pointB: null,
    });
    setPromptScale(false);
    setPendingScaleValue("");
    setPendingScaleUnit("ft");
  }, []);

  const saveCalibration = useCallback(async (scale: number, unit: string) => {
    if (!sheetId || !projectId) return;
    const current = calibrationRef.current;
    try {
      await fetch(`/api/projects/${projectId}/plans/${sheetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calibration: {
            enabled: true,
            scale,
            unit,
            pointA: current.pointA,
            pointB: current.pointB,
          },
        }),
      });
    } catch {
      // ignore persistence errors for now
    }
  }, [projectId, sheetId]);

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const clickedPoint = { x, y };

    if (activeTool === "calibration") {
      const current = calibrationRef.current;
      const origin = current.pointA ?? null;
      const snappedPoint = origin ? snapPointToAngle(origin, clickedPoint) : clickedPoint;

      if (!current.pointA) {
        setCalibration((prev) => ({ ...prev, pointA: snappedPoint }));
        return;
      }

      if (!current.pointB) {
        const pointA = current.pointA;
        const pointB = snappedPoint;
        const distance = Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y);
        if (distance > 0) {
          setCalibration((prev) => ({ ...prev, pointB }));
          setPromptScale(true);
        }
      }
      return;
    }

    if (!activeTool || !["linear", "polyline", "area"].includes(activeTool)) return;

    const origin = measurementPoints[measurementPoints.length - 1] ?? null;
    const snappedPoint = origin ? snapPointToAngle(origin, clickedPoint) : clickedPoint;

    setMeasurementPoints((prev) => {
      if (activeTool === "linear") {
        if (prev.length >= 2) {
          return [prev[prev.length - 1], snappedPoint];
        }
        return [...prev, snappedPoint];
      }
      return [...prev, snappedPoint];
    });
  }, [activeTool, measurementPoints, snapPointToAngle]);

  const confirmCalibration = useCallback(async () => {
    const scale = Number(pendingScaleValue);
    if (!Number.isFinite(scale) || scale <= 0) return;

    const current = calibrationRef.current;
    const next = {
      enabled: true,
      scale,
      unit: pendingScaleUnit,
      pointA: current.pointA,
      pointB: current.pointB,
    };

    setCalibration((prev) => ({ ...prev, ...next }));
    setPromptScale(false);
    setPendingScaleValue("");
    setPendingScaleUnit("ft");
    await saveCalibration(scale, pendingScaleUnit);
  }, [pendingScaleUnit, pendingScaleValue, saveCalibration]);

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="flex items-center gap-2 border-b border-[#E5EAF2] bg-white px-3 py-2">
        {[
          { key: "linear", label: "Linear", icon: "↔" },
          { key: "polyline", label: "Polyline", icon: "⟷" },
          { key: "area", label: "Area", icon: "▭" },
          { key: "calibration", label: "Calibration", icon: "⌖" },
        ].map((tool) => {
          const isActive = activeTool === tool.key;
          return (
            <button
              key={tool.key}
              type="button"
              onClick={() => {
                if (tool.key === "calibration") {
                  if (isActive) {
                    resetCalibration();
                    setMeasurementPoints([]);
                    setActiveTool(null);
                  } else {
                    resetCalibration();
                    setMeasurementPoints([]);
                    setActiveTool("calibration");
                  }
                } else {
                  setMeasurementPoints([]);
                  setActiveTool(isActive ? null : (tool.key as "linear" | "polyline" | "area" | "calibration"));
                }
              }}
              title={tool.label}
              className={`flex h-9 w-9 items-center justify-center rounded border text-base transition-colors ${
                isActive
                  ? "border-[#4A90E2] bg-[#4A90E2] text-white"
                  : "border-[#E5EAF2] bg-[#F3F4F6] text-gray-700 hover:bg-[#E5EAF2]"
              }`}
            >
              {tool.icon}
            </button>
          );
        })}
      </div>

      {/* Scrollable drawing area */}
      <div
        ref={outerRef}
        className="flex-1 overflow-auto bg-[#F3F4F6]"
      >
        <div className="flex min-h-full min-w-full items-center justify-center">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-orange-400" />
              <span className="text-sm">Loading drawing…</span>
            </div>
          )}
          {status === "error" && (
            <p className="text-sm text-gray-400">Could not load PDF</p>
          )}
          <canvas
            ref={canvasRef}
            className="shadow-xl"
            style={{ display: status === "done" ? "block" : "none" }}
            onClick={handleCanvasClick}
          />
        </div>
      </div>

      {promptScale && (
        <div className="absolute inset-x-4 top-4 z-20 mx-auto max-w-sm rounded-xl border border-[#E5EAF2] bg-white p-4 shadow-lg">
          <p className="mb-2 text-sm font-semibold text-gray-800">Enter the real-world scale for the selected distance</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              value={pendingScaleValue}
              onChange={(e) => setPendingScaleValue(e.target.value)}
              placeholder="e.g. 10"
              className="w-full rounded border border-[#E5EAF2] px-3 py-2 text-sm"
            />
            <select
              value={pendingScaleUnit}
              onChange={(e) => setPendingScaleUnit(e.target.value)}
              className="rounded border border-[#E5EAF2] px-3 py-2 text-sm"
            >
              <option value="ft">ft</option>
              <option value="m">m</option>
              <option value="in">in</option>
            </select>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => resetCalibration()}
              className="rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void confirmCalibration()}
              className="rounded bg-[#4A90E2] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#7FB3FF]"
            >
              Save scale
            </button>
          </div>
        </div>
      )}

      {/* Zoom controls — bottom-right corner */}
      <div
        className="absolute bottom-5 right-5 flex items-stretch overflow-hidden rounded-lg border border-[#E5EAF2] bg-white shadow-lg"
        style={{ display: status === "done" ? "flex" : "none" }}
      >
        <button
          onClick={zoomOut}
          disabled={zoom <= MIN_ZOOM}
          title="Zoom out (scroll down)"
          className="flex w-9 items-center justify-center text-xl font-light text-gray-600 hover:bg-gray-100 disabled:opacity-30"
        >
          −
        </button>

        <button
          onClick={() => setZoom(1)}
          title="Reset to fit"
          className="w-16 border-x border-[#E5EAF2] py-1.5 text-center text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          onClick={zoomIn}
          disabled={zoom >= MAX_ZOOM}
          title="Zoom in (scroll up)"
          className="flex w-9 items-center justify-center text-xl font-light text-gray-600 hover:bg-gray-100 disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  );
}
