import mongoose, { Schema, model } from "mongoose";

const PlanParameterSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["count", "linear", "sqf"], required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

if (mongoose.models.PlanParameter) delete mongoose.models.PlanParameter;

export default model("PlanParameter", PlanParameterSchema);
