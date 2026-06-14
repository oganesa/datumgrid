import mongoose, { Schema, model } from "mongoose";

const AssetTypeSchema = new Schema(
  {
    typeCode: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      match: /^[0-9]{3}$/,
    },
    typeName: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

if (mongoose.models.AssetType) {
  delete mongoose.models.AssetType;
}

const AssetType = model("AssetType", AssetTypeSchema);
export default AssetType;
