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
  assetTypeId: string | null;
  assetTypeCode: string | null;
  assetTypeName: string | null;
  parentAssetId: string | null;
  parentAssetName: string | null;
  contactPersonId: string | null;
  contactPersonName: string | null;
  contactPersonEmail: string | null;
  contactPersonPhone: string | null;
  assetName: string;
  description: string | null;
  assetNumber: string | null;
  serviceAndPart: string;
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

function pickAssetType(
  raw: unknown
): { assetTypeId: string | null; assetTypeCode: string | null; assetTypeName: string | null } {
  if (raw == null) return { assetTypeId: null, assetTypeCode: null, assetTypeName: null };
  if (raw instanceof mongoose.Types.ObjectId) {
    return { assetTypeId: raw.toString(), assetTypeCode: null, assetTypeName: null };
  }
  if (typeof raw === "object" && "_id" in raw) {
    const t = raw as { _id: mongoose.Types.ObjectId; typeCode?: string; typeName?: string };
    return {
      assetTypeId: t._id.toString(),
      assetTypeCode: trimOrEmpty(t.typeCode) || null,
      assetTypeName: trimOrEmpty(t.typeName) || null,
    };
  }
  return { assetTypeId: null, assetTypeCode: null, assetTypeName: null };
}

function pickContactPerson(raw: unknown): {
  contactPersonId: string | null;
  contactPersonName: string | null;
  contactPersonEmail: string | null;
  contactPersonPhone: string | null;
} {
  const empty = { contactPersonId: null, contactPersonName: null, contactPersonEmail: null, contactPersonPhone: null };
  if (raw == null) return empty;
  if (raw instanceof mongoose.Types.ObjectId) return { ...empty, contactPersonId: raw.toString() };
  if (typeof raw === "object" && "_id" in raw) {
    const c = raw as { _id: mongoose.Types.ObjectId; prefix?: string; firstName?: string; lastName?: string; email?: string; phone?: string };
    const parts = [c.prefix, c.firstName, c.lastName].filter(Boolean);
    return {
      contactPersonId: c._id.toString(),
      contactPersonName: parts.length ? parts.join(" ") : null,
      contactPersonEmail: trimOrEmpty(c.email) || null,
      contactPersonPhone: trimOrEmpty(c.phone) || null,
    };
  }
  return empty;
}

function pickParentAsset(
  raw: unknown
): { parentAssetId: string | null; parentAssetName: string | null } {
  if (raw == null) {
    return { parentAssetId: null, parentAssetName: null };
  }
  if (raw instanceof mongoose.Types.ObjectId) {
    return { parentAssetId: raw.toString(), parentAssetName: null };
  }
  if (typeof raw === "object" && "_id" in raw) {
    const p = raw as { _id: mongoose.Types.ObjectId; assetName?: string };
    return {
      parentAssetId: p._id.toString(),
      parentAssetName: trimOrEmpty(p.assetName) || null,
    };
  }
  return { parentAssetId: null, parentAssetName: null };
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

  const { customerId: cid, customerName: cname } = pickCustomer(row.customerId);
  const { assetTypeId: atid, assetTypeCode: atcode, assetTypeName: atname } = pickAssetType(row.assetTypeId);
  const { parentAssetId: paid, parentAssetName: paname } = pickParentAsset(row.parentAssetId);
  const { contactPersonId: cpid, contactPersonName: cpname, contactPersonEmail: cpemail, contactPersonPhone: cpphone } = pickContactPerson(row.contactPersonId);

  const dates = (d: unknown) =>
    d instanceof Date ? d.toISOString() : null;

  return {
    _id: id.toString(),
    projectId: pid,
    projectNumber: includeProject ? pnum : null,
    projectName: includeProject ? pname : null,
    customerId: cid,
    customerName: cname,
    assetTypeId: atid,
    assetTypeCode: atcode,
    assetTypeName: atname,
    parentAssetId: paid,
    parentAssetName: paname,
    contactPersonId: cpid,
    contactPersonName: cpname,
    contactPersonEmail: cpemail,
    contactPersonPhone: cpphone,
    assetName: trimOrEmpty(row.assetName) || "",
    description: trimOrEmpty(row.description) || null,
    assetNumber: trimOrEmpty(row.assetNumber) || null,
    serviceAndPart: trimOrEmpty(row.serviceAndPart) || "",
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
  { path: "parentAssetId" as const, select: "assetName" },
  { path: "assetTypeId" as const, select: "typeCode typeName" },
  { path: "contactPersonId" as const, select: "prefix firstName lastName email phone" },
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
