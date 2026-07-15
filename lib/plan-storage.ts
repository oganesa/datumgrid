import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

const ROOT = path.join(process.cwd(), "uploads", "plans");

export function plansDirForProject(projectId: string): string {
  return path.join(ROOT, projectId);
}

export function planFileAbsolutePath(
  projectId: string,
  storedFileName: string
): string {
  if (
    storedFileName.includes("..") ||
    storedFileName.includes("/") ||
    storedFileName.includes("\\")
  ) {
    throw new Error("Invalid stored file name.");
  }
  return path.join(plansDirForProject(projectId), storedFileName);
}

export async function ensurePlansDir(projectId: string): Promise<void> {
  await fs.mkdir(plansDirForProject(projectId), { recursive: true });
}

export function newPlanFileName(): string {
  return `${randomUUID()}.pdf`;
}
