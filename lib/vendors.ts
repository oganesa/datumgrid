import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import Vendor from "@/models/Vendor";

export type SerializedVendor = {
  _id: string;
  name: string;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  web?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

function trimOrNull(s: unknown): string | null {
  if (s == null || typeof s !== "string") return null;
  const t = s.trim();
  return t === "" ? null : t;
}

function serializeVendor(doc: Record<string, unknown>): SerializedVendor {
  const v = doc as {
    _id: mongoose.Types.ObjectId;
    name: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    phone?: string;
    email?: string;
    web?: string;
    createdAt: Date;
    updatedAt?: Date;
  };
  return {
    _id: v._id.toString(),
    name: v.name,
    address1: trimOrNull(v.address1),
    address2: trimOrNull(v.address2),
    city: trimOrNull(v.city),
    state: trimOrNull(v.state),
    zipCode: trimOrNull(v.zipCode),
    country: trimOrNull(v.country),
    phone: trimOrNull(v.phone),
    email: trimOrNull(v.email),
    web: trimOrNull(v.web),
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt?.toISOString() ?? null,
  };
}

export async function getVendors(): Promise<SerializedVendor[]> {
  await connectDB();
  const rows = await Vendor.find().sort({ name: 1 }).lean();
  return rows.map((row) => serializeVendor(row as Record<string, unknown>));
}
