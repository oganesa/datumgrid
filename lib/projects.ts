import mongoose from "mongoose";
import { cache } from "react";

import { connectDB } from "@/lib/mongodb";
import Project from "@/models/Project";

export type SerializedProject = {
  _id: string;
  name: string;
  number: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  /** Linked Customer document id when set */
  customerId?: string | null;
  /** Display name from Customer or legacy free-text field */
  customerName?: string | null;
  /** Hero image: render, logo, etc. */
  coverImageUrl?: string | null;
};

function trimOrNull(s: string | undefined | null): string | null {
  if (s == null || typeof s !== "string") return null;
  const t = s.trim();
  return t === "" ? null : t;
}

function pickCustomerIdAndName(p: Record<string, unknown>): {
  customerId: string | null;
  customerName: string | null;
} {
  const legacy =
    trimOrNull(p.customerName as string | undefined) ??
    trimOrNull((p as { clientName?: string }).clientName);

  const raw = p.customerId;
  if (raw == null) {
    return { customerId: null, customerName: legacy };
  }

  if (typeof raw === "object" && raw !== null && "_id" in raw) {
    const pop = raw as { _id: mongoose.Types.ObjectId; name?: string };
    return {
      customerId: pop._id.toString(),
      customerName: trimOrNull(pop.name) ?? legacy,
    };
  }

  if (raw instanceof mongoose.Types.ObjectId) {
    return { customerId: raw.toString(), customerName: legacy };
  }

  return { customerId: null, customerName: legacy };
}

function serializeProject(project: Record<string, unknown>): SerializedProject {
  const p = project as {
    _id: mongoose.Types.ObjectId;
    name: string;
    number: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    status: string;
    createdAt: Date;
    updatedAt?: Date;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    customerName?: string;
    customerId?: unknown;
    clientName?: string;
    coverImageUrl?: string;
  };
  const { customerId: cid, customerName: cname } = pickCustomerIdAndName(
    project as Record<string, unknown>
  );
  return {
    _id: p._id.toString(),
    name: p.name,
    number: p.number,
    description: p.description ?? null,
    startDate: p.startDate ? p.startDate.toISOString() : null,
    endDate: p.endDate ? p.endDate.toISOString() : null,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt?.toISOString() ?? null,
    address1: p.address1?.trim() ? p.address1.trim() : null,
    address2: p.address2?.trim() ? p.address2.trim() : null,
    city: p.city?.trim() ? p.city.trim() : null,
    state: p.state?.trim() ? p.state.trim() : null,
    zipCode: p.zipCode?.trim() ? p.zipCode.trim() : null,
    country: p.country?.trim() ? p.country.trim() : null,
    customerId: cid,
    customerName: cname,
    coverImageUrl: trimOrNull(p.coverImageUrl as string | undefined),
  };
}

export async function getProjects(): Promise<SerializedProject[]> {
  await connectDB();

  const projects = await Project.find()
    .populate({ path: "customerId", select: "name" })
    .sort({ createdAt: -1 })
    .lean();

  return projects.map((project) => serializeProject(project as Record<string, unknown>));
}

async function loadProjectById(id: string): Promise<SerializedProject | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  await connectDB();
  const project = await Project.findById(id)
    .populate({ path: "customerId", select: "name" })
    .lean();
  if (!project) return null;

  return serializeProject(project as Record<string, unknown>);
}

/** Dedupes within a single request (layout + page). */
export const getProjectById = cache(loadProjectById);

/** Multi-line postal address for display (skips empty parts). */
export function formatProjectAddressLines(p: SerializedProject): string[] {
  const lines: string[] = [];
  if (p.address1) lines.push(p.address1);
  if (p.address2) lines.push(p.address2);
  const cityLine = [p.city, p.state, p.zipCode].filter(Boolean).join(", ");
  if (cityLine) lines.push(cityLine);
  if (p.country) lines.push(p.country);
  return lines;
}