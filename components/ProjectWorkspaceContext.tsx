"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { updateProject } from "@/actions/projectActions";
import type { SerializedProject } from "@/lib/projects";

type ProjectWorkspaceContextValue = {
  project: SerializedProject;
  isEditing: boolean;
  draft: SerializedProject | null;
  beginEdit: () => void;
  cancelEdit: () => void;
  saving: boolean;
  saveEdit: () => Promise<{ success: boolean; error?: string }>;
  setDraft: (patch: Partial<SerializedProject>) => void;
  coverFile: File | null;
  setCoverFile: (f: File | null) => void;
  removeCover: boolean;
  setRemoveCover: (v: boolean) => void;
};

const ProjectWorkspaceContext =
  createContext<ProjectWorkspaceContextValue | null>(null);

export function useProjectWorkspace(): ProjectWorkspaceContextValue {
  const ctx = useContext(ProjectWorkspaceContext);
  if (!ctx) {
    throw new Error("useProjectWorkspace must be used within ProjectWorkspaceProvider");
  }
  return ctx;
}

function appendIfPresent(fd: FormData, key: string, value: string | null | undefined) {
  if (value == null || value === "") return;
  fd.set(key, value);
}

export function ProjectWorkspaceProvider({
  initialProject,
  children,
}: {
  initialProject: SerializedProject;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [project, setProject] = useState(initialProject);

  useEffect(() => {
    setProject(initialProject);
  }, [initialProject]);

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraftState] = useState<SerializedProject | null>(null);
  const [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [removeCover, setRemoveCover] = useState(false);

  const beginEdit = useCallback(() => {
    setDraftState({ ...project });
    setIsEditing(true);
  }, [project]);

  const cancelEdit = useCallback(() => {
    setDraftState(null);
    setIsEditing(false);
    setCoverFile(null);
    setRemoveCover(false);
  }, []);

  const setDraft = useCallback((patch: Partial<SerializedProject>) => {
    setDraftState((d) => (d ? { ...d, ...patch } : d));
  }, []);

  const saveEdit = useCallback(async () => {
    if (!draft) return { success: false, error: "Nothing to save." };
    setSaving(true);
    try {
      const fd = new FormData();
      fd.set("name", draft.name);
      fd.set("number", draft.number);
      appendIfPresent(fd, "description", draft.description);
      fd.set("status", draft.status || "Active");
      appendIfPresent(
        fd,
        "startDate",
        draft.startDate ? draft.startDate.slice(0, 10) : null
      );
      appendIfPresent(
        fd,
        "endDate",
        draft.endDate ? draft.endDate.slice(0, 10) : null
      );
      appendIfPresent(fd, "address1", draft.address1);
      appendIfPresent(fd, "address2", draft.address2);
      appendIfPresent(fd, "city", draft.city);
      appendIfPresent(fd, "state", draft.state);
      appendIfPresent(fd, "zipCode", draft.zipCode);
      appendIfPresent(fd, "country", draft.country);
      appendIfPresent(fd, "customerName", draft.customerName);
      if (draft.customerId) {
        fd.set("customerId", draft.customerId);
      }
      if (removeCover) fd.set("removeCover", "1");
      if (coverFile && coverFile.size > 0) fd.set("coverImage", coverFile);

      const result = await updateProject(project._id, fd);
      if (result.success) {
        setIsEditing(false);
        setDraftState(null);
        setCoverFile(null);
        setRemoveCover(false);
        router.refresh();
        return { success: true };
      }
      return { success: false, error: result.error };
    } finally {
      setSaving(false);
    }
  }, [coverFile, draft, project._id, removeCover, router]);

  const value = useMemo(
    (): ProjectWorkspaceContextValue => ({
      project,
      isEditing,
      draft,
      beginEdit,
      cancelEdit,
      saving,
      saveEdit,
      setDraft,
      coverFile,
      setCoverFile,
      removeCover,
      setRemoveCover,
    }),
    [
      project,
      isEditing,
      draft,
      beginEdit,
      cancelEdit,
      saving,
      saveEdit,
      setDraft,
      coverFile,
      removeCover,
    ]
  );

  return (
    <ProjectWorkspaceContext.Provider value={value}>
      {children}
    </ProjectWorkspaceContext.Provider>
  );
}
