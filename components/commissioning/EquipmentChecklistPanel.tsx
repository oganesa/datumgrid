"use client";

import { useCallback, useEffect, useState } from "react";

type Item = { id: string; label: string };

const DEFAULT_ITEMS: Item[] = [
  { id: "docs", label: "Manufacturer documentation received and filed" },
  { id: "datasheets", label: "Data sheets and drawings match installed equipment" },
  { id: "install-manual", label: "Installation manual requirements reviewed" },
  { id: "mount", label: "Mechanical mounting, torque, and supports verified" },
  { id: "electrical", label: "Electrical connections, grounding, and labeling verified" },
  { id: "controls", label: "Controls / BMS integration points tested" },
  { id: "safety", label: "Safety devices and interlocks verified" },
  { id: "functional", label: "Functional / performance tests completed" },
  { id: "training", label: "Operator training and handover scheduled or completed" },
  { id: "punch", label: "Punch list items for this equipment closed out" },
];

function storageKey(equipmentId: string) {
  return `datumgrid-equipment-checklist-${equipmentId}`;
}

type Props = {
  equipmentId: string;
  active: boolean;
};

export default function EquipmentChecklistPanel({ equipmentId, active }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const load = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(storageKey(equipmentId));
      if (!raw) {
        setChecked({});
        return;
      }
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        setChecked(parsed as Record<string, boolean>);
      }
    } catch {
      setChecked({});
    }
  }, [equipmentId]);

  useEffect(() => {
    if (!active) return;
    load();
  }, [active, load]);

  function toggle(id: string) {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(storageKey(equipmentId), JSON.stringify(next));
      } catch {
        /* quota or private mode */
      }
      return next;
    });
  }

  const doneCount = DEFAULT_ITEMS.filter((i) => checked[i.id]).length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Track commissioning steps for this equipment. Progress is saved in this
        browser only (local storage).
      </p>
      <p className="text-xs text-gray-500">
        {doneCount} of {DEFAULT_ITEMS.length} items checked
      </p>
      <ul className="space-y-2">
        {DEFAULT_ITEMS.map((item) => (
          <li
            key={item.id}
            className="flex gap-3 rounded-md border border-gray-200 bg-white px-3 py-2.5 shadow-sm"
          >
            <input
              type="checkbox"
              id={`chk-${equipmentId}-${item.id}`}
              checked={Boolean(checked[item.id])}
              onChange={() => toggle(item.id)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-[#4A90E2] focus:ring-[#4A90E2]"
            />
            <label
              htmlFor={`chk-${equipmentId}-${item.id}`}
              className={`cursor-pointer text-sm leading-snug ${
                checked[item.id] ? "text-gray-500 line-through" : "text-gray-900"
              }`}
            >
              {item.label}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
