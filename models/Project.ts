import mongoose, { Schema, model } from "mongoose";

import "./Customer";

const ProjectSchema = new Schema(
  {
    name: { type: String, required: true },
    number: { type: String, required: true },
    description: String,
    startDate: Date,
    endDate: Date,
    status: { type: String, default: "Active" },
    address1: String,
    address2: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    customerName: String,
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", default: null },
    /** Public URL path e.g. /uploads/projects/{id}/cover.jpg */
    coverImageUrl: { type: String, default: null },
  },
  { timestamps: true }
);

/**
 * Next.js dev / hot reload can keep a stale compiled model without new paths.
 * Without this, populate("customerId") throws StrictPopulateError after schema changes.
 */
if (mongoose.models.Project) {
  delete mongoose.models.Project;
}

const Project = model("Project", ProjectSchema);

export default Project;
