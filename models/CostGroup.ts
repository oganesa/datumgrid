import mongoose, { Schema, models, model } from "mongoose";

const CostGroupSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const CostGroup = models.CostGroup || model("CostGroup", CostGroupSchema);

export default CostGroup;
