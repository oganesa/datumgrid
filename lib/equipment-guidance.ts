import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import type { GuidanceCategory } from "@/lib/equipment-guidance-types";
import EquipmentGuidanceFile from "@/models/EquipmentGuidanceFile";

export type SerializedGuidanceFile = {
  _id: string;
  equipmentId: string;
  category: GuidanceCategory;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export async function listGuidanceFilesByEquipmentId(
  equipmentId: string
): Promise<SerializedGuidanceFile[]> {
  if (!mongoose.Types.ObjectId.isValid(equipmentId)) return [];

  await connectDB();
  const rows = await EquipmentGuidanceFile.find({
    equipmentId: new mongoose.Types.ObjectId(equipmentId),
  })
    .sort({ createdAt: -1 })
    .lean();

  return rows.map((r) => {
    const doc = r as {
      _id: mongoose.Types.ObjectId;
      equipmentId: mongoose.Types.ObjectId;
      category: GuidanceCategory;
      originalName: string;
      mimeType: string;
      sizeBytes: number;
      createdAt: Date;
    };
    return {
      _id: doc._id.toString(),
      equipmentId: doc.equipmentId.toString(),
      category: doc.category,
      originalName: doc.originalName,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
      createdAt: doc.createdAt.toISOString(),
    };
  });
}
