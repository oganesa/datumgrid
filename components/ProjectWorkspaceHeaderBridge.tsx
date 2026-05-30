"use client";

import { useEffect } from "react";

import { useHeaderTitle } from "@/components/HeaderTitleContext";

import { useProjectWorkspace } from "./ProjectWorkspaceContext";

/** Pushes the current project name into the global app header while this workspace is mounted. */
export default function ProjectWorkspaceHeaderBridge() {
  const { project } = useProjectWorkspace();
  const { setTitleOverride } = useHeaderTitle();

  useEffect(() => {
    setTitleOverride(project.name);
    return () => setTitleOverride(null);
  }, [project.name, setTitleOverride]);

  return null;
}
