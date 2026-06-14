"use client";

import { useState } from "react";

export type ContactOption = {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
};

type Props = {
  name: string;
  options: ContactOption[];
  defaultValue?: string | null;
};

export default function ContactPicker({ name, options, defaultValue }: Props) {
  const initial = options.find((o) => o._id === defaultValue) ?? null;
  const [selected, setSelected] = useState<ContactOption | null>(initial);
  const [inputValue, setInputValue] = useState(initial?.fullName ?? "");
  const [open, setOpen] = useState(false);

  const filtered = options.filter((o) =>
    o.fullName.toLowerCase().includes(inputValue.toLowerCase())
  );

  function pick(opt: ContactOption) {
    setSelected(opt);
    setInputValue(opt.fullName);
    setOpen(false);
  }

  function clear() {
    setSelected(null);
    setInputValue("");
  }

  return (
    <div className="relative">
      <input type="hidden" name={name} value={selected?._id ?? ""} />
      <div className="flex gap-1">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setOpen(true); setSelected(null); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search contact…"
          className="w-full rounded border border-[#D5D5D5] p-2 text-sm outline-none focus:border-[#0099FF]"
        />
        {selected && (
          <button
            type="button"
            onClick={clear}
            className="shrink-0 rounded border border-[#D5D5D5] px-2 text-gray-400 hover:text-gray-700"
            title="Clear"
          >
            ✕
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          {filtered.map((o) => (
            <li key={o._id}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); pick(o); }}
                className="flex w-full flex-col px-3 py-1.5 text-left hover:bg-[#D5EEFF]"
              >
                <span className="text-sm font-medium text-gray-900">{o.fullName}</span>
                {(o.email || o.phone) && (
                  <span className="text-xs text-gray-500">
                    {[o.email, o.phone].filter(Boolean).join(" · ")}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <p className="mt-1 text-xs text-gray-500">
          {[selected.email, selected.phone].filter(Boolean).join(" · ")}
        </p>
      )}
    </div>
  );
}
