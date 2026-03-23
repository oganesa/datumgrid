import mongoose, { Schema, models, model } from "mongoose";

const ProjectSchema = new Schema(
  {
    name: { type: String, required: true },
    number: { type: String, required: true },
    description: String,
    startDate: Date,
    endDate: Date,
    status: { type: String, default: "Active" },
  },
  { timestamps: true }
);

// ✅ CRITICAL LINE
const Project =
  models.Project || model("Project", ProjectSchema);

export default Project;
