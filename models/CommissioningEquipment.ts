import mongoose, { Schema, model } from "mongoose";

import "./Customer";
import "./Project";

const CommissioningEquipmentSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },
    assetName: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    assetNumber: { type: String, default: "" },
    serviceAndPart: { type: String, required: true, trim: true },
    parentAsset: { type: String, default: "" },
    giai: { type: String, default: "" },
    orderedDate: { type: Date, default: null },
    installationDate: { type: Date, default: null },
    purchasedDate: { type: Date, default: null },
    warrantyExpiration: { type: Date, default: null },
    contact: { type: String, required: true, trim: true },
    address: { type: String, default: "" },
  },
  { timestamps: true }
);

/**
 * Next.js dev / hot reload can keep a stale compiled model without new paths.
 * Without this, populate("customerId") throws StrictPopulateError after schema changes.
 */
if (mongoose.models.CommissioningEquipment) {
  delete mongoose.models.CommissioningEquipment;
}

const CommissioningEquipment = model(
  "CommissioningEquipment",
  CommissioningEquipmentSchema
);

export default CommissioningEquipment;
