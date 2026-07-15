import mongoose, { Schema, model } from "mongoose";

const PlanSheetSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    originalFileName: { type: String, required: true },
    sheetName: { type: String, required: true },
    pageNumber: { type: Number, required: true },
    storedFileName: { type: String, required: true },
    discipline: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

if (mongoose.models.PlanSheet) delete mongoose.models.PlanSheet;

export default model("PlanSheet", PlanSheetSchema);
