import mongoose, { Schema, model } from "mongoose";

import "./CommissioningEquipment";
import { GUIDANCE_CATEGORY_VALUES } from "@/lib/equipment-guidance-types";

export { GUIDANCE_CATEGORY_VALUES };
export type { GuidanceCategory } from "@/lib/equipment-guidance-types";

const EquipmentGuidanceFileSchema = new Schema(
  {
    equipmentId: {
      type: Schema.Types.ObjectId,
      ref: "CommissioningEquipment",
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: [...GUIDANCE_CATEGORY_VALUES],
    },
    originalName: { type: String, required: true, trim: true },
    /** File name on disk within `uploads/equipment-guidance/{equipmentId}/` */
    storedFileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
  },
  { timestamps: true }
);

if (mongoose.models.EquipmentGuidanceFile) {
  delete mongoose.models.EquipmentGuidanceFile;
}

const EquipmentGuidanceFile = model(
  "EquipmentGuidanceFile",
  EquipmentGuidanceFileSchema
);

export default EquipmentGuidanceFile;
