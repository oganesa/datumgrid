"use client";

import { useEffect, useRef, useState } from "react";

import { deleteCommissioningView } from "@/actions/commissioningViewActions";
import {
  ALL_ASSETS_VIEW_ID,
  type SerializedView,
} from "@/lib/commissioning-view-types";

function IconChevron() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IconAnchor({ filled }: { filled: boolean }) {
  return (
    <svg
      className={`h-3.5 w-3.5 ${filled ? "text-[#0099FF]" : "text-gray-400"}`}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <circle cx="12" cy="5" r="3" />
      <line x1="12" y1="8" x2="12" y2="22" />
      <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M8 6V4h8v2" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

type Props = {
  views: SerializedView[];
  activeViewId: string;
  defaultViewId: string;
  onViewChange: (id: string) => void;
  onSetDefault: (id: string) => void;
  onCreateView: () => void;
  onEditView: (view: SerializedView) => void;
  onViewDeleted: (id: string) => void;
};

export default function ViewSelector({
  views = [],
  activeViewId,
  defaultViewId,
  onViewChange,
  onSetDefault,
  onCreateView,
  onEditView,
  onViewDeleted,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const activeViewName =
    activeViewId === ALL_ASSETS_VIEW_ID
      ? "All assets"
      : (views.find((v) => v._id === activeViewId)?.name ?? "All assets");

  const filteredViews = search
    ? views.filter((v) => v.name.toLowerCase().includes(search.toLowerCase()))
    : views;

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this view?")) return;
    const result = await deleteCommissioningView(id);
    if (result.success) {
      onViewDeleted(id);
    } else {
      alert(result.error);
    }
  }

  function handleSetDefault(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    onSetDefault(id);
  }

  function handleSelect(id: string) {
    onViewChange(id);
    setOpen(false);
    setSearch("");
  }

  const showAllAssets =
    !search || "all assets".includes(search.toLowerCase());

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md border border-[#D5D5D5] bg-white px-3 py-1.5 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50"
      >
        {activeViewName}
        <IconChevron />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-64 rounded-lg border border-[#D5D5D5] bg-white shadow-xl">
          {/* Search */}
          <div className="border-b border-[#D5D5D5] px-2 py-1.5">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              autoFocus
              className="w-full rounded bg-gray-50 px-2 py-1 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-[#0099FF]"
            />
          </div>

          <div className="max-h-72 overflow-y-auto py-1">
            {/* Predefined Views section */}
            {showAllAssets && (
              <>
                <p className="px-3 pb-0.5 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Predefined Views
                </p>
                <ViewRow
                  id={ALL_ASSETS_VIEW_ID}
                  name="All assets"
                  isActive={activeViewId === ALL_ASSETS_VIEW_ID}
                  isDefault={defaultViewId === ALL_ASSETS_VIEW_ID}
                  onSelect={() => handleSelect(ALL_ASSETS_VIEW_ID)}
                  onSetDefault={(e) => handleSetDefault(ALL_ASSETS_VIEW_ID, e)}
                />
              </>
            )}

            {/* Custom views */}
            {filteredViews.length > 0 && (
              <>
                {showAllAssets && (
                  <div className="mx-3 my-1 border-t border-[#D5D5D5]" />
                )}
                {filteredViews.map((v) => (
                  <ViewRow
                    key={v._id}
                    id={v._id}
                    name={v.name}
                    isActive={activeViewId === v._id}
                    isDefault={defaultViewId === v._id}
                    onSelect={() => handleSelect(v._id)}
                    onSetDefault={(e) => handleSetDefault(v._id, e)}
                    onEdit={(e) => {
                      e.stopPropagation();
                      setOpen(false);
                      onEditView(v);
                    }}
                    onDelete={(e) => handleDelete(v._id, e)}
                  />
                ))}
              </>
            )}

            {!showAllAssets && filteredViews.length === 0 && (
              <p className="px-3 py-2 text-xs text-gray-400">No views match</p>
            )}
          </div>

          <div className="border-t border-[#D5D5D5] px-3 py-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onCreateView();
              }}
              className="text-xs font-medium text-[#0099FF] hover:text-[#2AAAFF]"
            >
              + Create Custom View
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ViewRow({
  id,
  name,
  isActive,
  isDefault,
  onSelect,
  onSetDefault,
  onEdit,
  onDelete,
}: {
  id: string;
  name: string;
  isActive: boolean;
  isDefault: boolean;
  onSelect: () => void;
  onSetDefault: (e: React.MouseEvent) => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-gray-50 ${
        isActive ? "font-semibold text-[#0099FF]" : "text-gray-700"
      }`}
    >
      <span className="truncate">{name}</span>
      <span className="ml-2 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        {onEdit && (
          <span
            role="button"
            tabIndex={0}
            title="Edit view"
            onClick={onEdit}
            onKeyDown={(e) => e.key === "Enter" && onEdit(e as unknown as React.MouseEvent)}
            className="rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
          >
            <IconEdit />
          </span>
        )}
        <span
          role="button"
          tabIndex={0}
          title={isDefault ? "Default view" : "Set as default view"}
          onClick={onSetDefault}
          onKeyDown={(e) => e.key === "Enter" && onSetDefault(e as unknown as React.MouseEvent)}
          className={`rounded p-0.5 hover:bg-gray-200 ${isDefault ? "opacity-100" : ""}`}
        >
          <IconAnchor filled={isDefault} />
        </span>
        {onDelete && (
          <span
            role="button"
            tabIndex={0}
            title="Delete view"
            onClick={onDelete}
            onKeyDown={(e) => e.key === "Enter" && onDelete(e as unknown as React.MouseEvent)}
            className="rounded p-0.5 text-gray-400 hover:bg-red-100 hover:text-red-600"
          >
            <IconTrash />
          </span>
        )}
      </span>
    </button>
  );
}
