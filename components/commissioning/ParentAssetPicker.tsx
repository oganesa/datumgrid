"use client";

import { useEffect, useRef, useState } from "react";

export type AssetOption = { _id: string; assetName: string };

type Props = {
  name: string;
  options: AssetOption[];
  defaultAssetId?: string | null;
  defaultAssetName?: string | null;
};

export default function ParentAssetPicker({
  name,
  options,
  defaultAssetId,
  defaultAssetName,
}: Props) {
  const [inputValue, setInputValue] = useState(defaultAssetName ?? "");
  const [selectedId, setSelectedId] = useState(defaultAssetId ?? "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter((o) =>
    o.assetName.toLowerCase().includes(inputValue.toLowerCase())
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
    setSelectedId("");
    setOpen(true);
  }

  function handleSelect(option: AssetOption) {
    setInputValue(option.assetName);
    setSelectedId(option._id);
    setOpen(false);
  }

  function handleClear() {
    setInputValue("");
    setSelectedId("");
    setOpen(false);
  }

  const showDropdown = open && inputValue.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={name} value={selectedId} />
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => inputValue && setOpen(true)}
          placeholder="Type to search assets…"
          autoComplete="off"
          className="w-full rounded border border-[#D5D5D5] p-2 pr-7 text-sm outline-none focus:border-[#0099FF]"
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-700"
            aria-label="Clear"
          >
            ✕
          </button>
        )}
      </div>

      {showDropdown && filtered.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded border border-[#D5D5D5] bg-white shadow-lg">
          {filtered.map((o) => (
            <li key={o._id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(o)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                {o.assetName}
              </button>
            </li>
          ))}
        </ul>
      )}

      {showDropdown && filtered.length === 0 && (
        <div className="absolute z-20 mt-1 w-full rounded border border-[#D5D5D5] bg-white px-3 py-2 text-sm text-gray-500 shadow-lg">
          No matching assets
        </div>
      )}
    </div>
  );
}
