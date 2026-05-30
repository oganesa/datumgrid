import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import CommissioningEquipment from "@/models/CommissioningEquipment";

export type SerializedCommissioningEquipment = {
  _id: string;
  projectId: string;
  projectNumber: string | null;
  projectName: string | null;
  customerId: string | null;
  customerName: string | null;
  assetName: string;
  description: string | null;
  assetNumber: string | null;
  serviceAndPart: string;
  parentAsset: string | null;
  giai: string | null;
  orderedDate: string | null;
  installationDate: string | null;
  purchasedDate: string | null;
  warrantyExpiration: string | null;
  contact: string;
  address: string | null;
  createdAt: string;
};

function trimOrEmpty(s: unknown): string {
  if (s == null || typeof s !== "string") return "";
  return s.trim();
}

function pickCustomer(
  raw: unknown
): { customerId: string | null; customerName: string | null } {
  if (raw == null) {
    return { customerId: null, customerName: null };
  }
  if (raw instanceof mongoose.Types.ObjectId) {
    return { customerId: raw.toString(), customerName: null };
  }
  if (typeof raw === "object" && "_id" in raw) {
    const c = raw as { _id: mongoose.Types.ObjectId; name?: string };
    return {
      customerId: c._id.toString(),
      customerName: trimOrEmpty(c.name) || null,
    };
  }
  return { customerId: null, customerName: null };
}

function serializeDoc(
  row: Record<string, unknown>,
  includeProject: boolean
): SerializedCommissioningEquipment {
  const id = row._id as mongoose.Types.ObjectId;
  const projectId = row.projectId as
    | mongoose.Types.ObjectId
    | { _id: mongoose.Types.ObjectId; number?: string; name?: string };
  let pid = "";
  let pnum: string | null = null;
  let pname: string | null = null;

  if (projectId instanceof mongoose.Types.ObjectId) {
    pid = projectId.toString();
  } else if (projectId && typeof projectId === "object" && "_id" in projectId) {
    pid = projectId._id.toString();
    if (includeProject) {
      pnum = trimOrEmpty(projectId.number) || null;
      pname = trimOrEmpty(projectId.name) || null;
    }
  }

  const { customerId: cid, customerName: cname } = pickCustomer(
    row.customerId
  );

  const dates = (d: unknown) =>
    d instanceof Date ? d.toISOString() : null;

  return {
    _id: id.toString(),
    projectId: pid,
    projectNumber: includeProject ? pnum : null,
    projectName: includeProject ? pname : null,
    customerId: cid,
    customerName: cname,
    assetName: trimOrEmpty(row.assetName) || "",
    description: trimOrEmpty(row.description) || null,
    assetNumber: trimOrEmpty(row.assetNumber) || null,
    serviceAndPart: trimOrEmpty(row.serviceAndPart) || "",
    parentAsset: trimOrEmpty(row.parentAsset) || null,
    giai: trimOrEmpty(row.giai) || null,
    orderedDate: dates(row.orderedDate),
    installationDate: dates(row.installationDate),
    purchasedDate: dates(row.purchasedDate),
    warrantyExpiration: dates(row.warrantyExpiration),
    contact: trimOrEmpty(row.contact) || "",
    address: trimOrEmpty(row.address) || null,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : new Date().toISOString(),
  };
}

const populatePaths = [
  { path: "projectId" as const, select: "name number" },
  { path: "customerId" as const, select: "name" },
] as const;

export async function getAllCommissioningEquipment(): Promise<
  SerializedCommissioningEquipment[]
> {
  await connectDB();
  const rows = await CommissioningEquipment.find()
    .populate([...populatePaths])
    .sort({ createdAt: -1 })
    .lean();

  return rows.map((r) =>
    serializeDoc(r as Record<string, unknown>, true)
  );
}

export async function getCommissioningEquipmentByProjectId(
  projectId: string
): Promise<SerializedCommissioningEquipment[]> {
  if (!mongoose.Types.ObjectId.isValid(projectId)) return [];

  await connectDB();
  const rows = await CommissioningEquipment.find({
    projectId: new mongoose.Types.ObjectId(projectId),
  })
    .populate([...populatePaths])
    .sort({ createdAt: -1 })
    .lean();

  return rows.map((r) =>
    serializeDoc(r as Record<string, unknown>, false)
  );
}
