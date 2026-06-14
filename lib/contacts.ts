import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import ContactModel from "@/models/Contact";

export type SerializedContact = {
  _id: string;
  prefix: string;
  firstName: string;
  lastName: string;
  fullName: string;
  title: string;
  email: string;
  phone: string;
  customerId: string | null;
  vendorId: string | null;
};

function fullName(prefix: string, first: string, last: string): string {
  return [prefix, first, last].filter(Boolean).join(" ");
}

function serialize(doc: Record<string, unknown>): SerializedContact {
  const d = doc as {
    _id: mongoose.Types.ObjectId;
    prefix?: string;
    firstName: string;
    lastName: string;
    title?: string;
    email?: string;
    phone?: string;
    customerId?: mongoose.Types.ObjectId | null;
    vendorId?: mongoose.Types.ObjectId | null;
  };
  const prefix = d.prefix?.trim() ?? "";
  const first  = d.firstName?.trim() ?? "";
  const last   = d.lastName?.trim() ?? "";
  return {
    _id:        d._id.toString(),
    prefix,
    firstName:  first,
    lastName:   last,
    fullName:   fullName(prefix, first, last),
    title:      d.title?.trim() ?? "",
    email:      d.email?.trim() ?? "",
    phone:      d.phone?.trim() ?? "",
    customerId: d.customerId ? d.customerId.toString() : null,
    vendorId:   d.vendorId   ? d.vendorId.toString()   : null,
  };
}

export async function getAllContacts(): Promise<SerializedContact[]> {
  await connectDB();
  const docs = await ContactModel.find().sort({ lastName: 1, firstName: 1 }).lean();
  return docs.map((d) => serialize(d as Record<string, unknown>));
}

export async function getContactsByCustomerId(customerId: string): Promise<SerializedContact[]> {
  if (!mongoose.Types.ObjectId.isValid(customerId)) return [];
  await connectDB();
  const docs = await ContactModel.find({ customerId: new mongoose.Types.ObjectId(customerId) })
    .sort({ lastName: 1, firstName: 1 })
    .lean();
  return docs.map((d) => serialize(d as Record<string, unknown>));
}

export async function getContactsByVendorId(vendorId: string): Promise<SerializedContact[]> {
  if (!mongoose.Types.ObjectId.isValid(vendorId)) return [];
  await connectDB();
  const docs = await ContactModel.find({ vendorId: new mongoose.Types.ObjectId(vendorId) })
    .sort({ lastName: 1, firstName: 1 })
    .lean();
  return docs.map((d) => serialize(d as Record<string, unknown>));
}
