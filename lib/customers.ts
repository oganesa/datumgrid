import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import Customer from "@/models/Customer";

export type SerializedCustomer = {
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

function serializeCustomer(doc: Record<string, unknown>): SerializedCustomer {
  const c = doc as {
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
    _id: c._id.toString(),
    name: c.name,
    address1: trimOrNull(c.address1),
    address2: trimOrNull(c.address2),
    city: trimOrNull(c.city),
    state: trimOrNull(c.state),
    zipCode: trimOrNull(c.zipCode),
    country: trimOrNull(c.country),
    phone: trimOrNull(c.phone),
    email: trimOrNull(c.email),
    web: trimOrNull(c.web),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt?.toISOString() ?? null,
  };
}

export async function getCustomers(): Promise<SerializedCustomer[]> {
  await connectDB();
  const rows = await Customer.find().sort({ name: 1 }).lean();
  return rows.map((row) => serializeCustomer(row as Record<string, unknown>));
}
