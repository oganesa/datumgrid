import mongoose, { Schema, model } from "mongoose";

import "./AssetType";
import "./Contact";
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
    assetTypeId: {
      type: Schema.Types.ObjectId,
      ref: "AssetType",
      default: null,
    },
    assetName: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    assetNumber: { type: String, default: "" },
    serviceAndPart: { type: String, required: true, trim: true },
    parentAssetId: {
      type: Schema.Types.ObjectId,
      ref: "CommissioningEquipment",
      default: null,
    },
    contactPersonId: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      default: null,
    },
    giai: { type: String, default: "" },
    orderedDate: { type: Date, default: null },
    installationDate: { type: Date, default: null },
    purchasedDate: { type: Date, default: null },
    warrantyExpiration: { type: Date, default: null },
    contact: { type: String, default: "" },
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
