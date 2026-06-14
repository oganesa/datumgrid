"use client";

import React from "react";

import ProjectWorkspaceTabs from "@/components/ProjectWorkspaceTabs";

import { useProjectWorkspace } from "./ProjectWorkspaceContext";

export default function ProjectWorkspaceTopBar() {
  const {
    project,
    isEditing,
    beginEdit,
    cancelEdit,
    saveEdit,
    saving,
  } = useProjectWorkspace();

  async function onSave() {
    const result = await saveEdit();
    if (!result.success) {
      alert(result.error ?? "Could not save.");
    }
  }

  return (
    <>
      <div className="border-b border-[#E5EAF2] bg-white px-8 py-3">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                disabled={saving}
                onClick={() => void cancelEdit()}
                className="rounded border border-[#E5EAF2] bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void onSave()}
                className="rounded bg-[#4A90E2] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#7FB3FF] disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => beginEdit()}
                className="rounded border border-[#E5EAF2] bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Edit project
              </button>
              {["Message", "Document", "Task", "To-do", "Daily log", "Time entry"].map(
                (label) => (
                  <button
                    key={label}
                    type="button"
                    className="rounded border border-[#E5EAF2] bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    + {label}
                  </button>
                )
              )}
            </>
          )}
        </div>
      </div>
      <div className="sticky top-0 z-10 border-b border-[#E5EAF2] bg-white shadow-sm">
        <ProjectWorkspaceTabs projectId={project._id} />
      </div>
    </>
  );
}
