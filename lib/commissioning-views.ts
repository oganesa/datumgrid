import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import CommissioningViewModel from "@/models/CommissioningView";
import type {
  ColumnKey,
  SerializedView,
  ViewFilter,
} from "@/lib/commissioning-view-types";

function serializeView(doc: Record<string, unknown>): SerializedView {
  const cols = doc.columns as string[];
  return {
    _id: (doc._id as mongoose.Types.ObjectId).toString(),
    name: (doc.name as string) ?? "",
    description: (doc.description as string) ?? "",
    filters: (doc.filters as ViewFilter[]) ?? [],
    columns: cols && cols.length > 0 ? (cols as ColumnKey[]) : null,
  };
}

export async function getCommissioningViews(
  userId: string
): Promise<SerializedView[]> {
  await connectDB();
  const docs = await CommissioningViewModel.find({ userId })
    .sort({ createdAt: 1 })
    .lean();
  return docs.map((d) => serializeView(d as Record<string, unknown>));
}
