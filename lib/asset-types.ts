import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import AssetTypeModel from "@/models/AssetType";

export type SerializedAssetType = {
  _id: string;
  typeCode: string;
  typeName: string;
};

function serialize(doc: Record<string, unknown>): SerializedAssetType {
  return {
    _id: (doc._id as mongoose.Types.ObjectId).toString(),
    typeCode: (doc.typeCode as string) ?? "",
    typeName: (doc.typeName as string) ?? "",
  };
}

export async function getAllAssetTypes(): Promise<SerializedAssetType[]> {
  await connectDB();
  const docs = await AssetTypeModel.find().sort({ typeCode: 1 }).lean();
  return docs.map((d) => serialize(d as Record<string, unknown>));
}
