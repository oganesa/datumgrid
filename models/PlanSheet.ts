import mongoose, { Schema, model } from "mongoose";

const PlanSheetSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    originalFileName: { type: String, required: true },
    sheetName: { type: String, required: true },
    pageNumber: { type: Number, required: true },
    /** Legacy local-disk filename. Only meaningful when storageProvider is "local". */
    storedFileName: { type: String, required: false, default: "" },
    /** Where the file actually lives. "local" covers legacy rows (incl. missing storageProvider). */
    storageProvider: { type: String, default: "local" },
    storageFileId: { type: String, default: "" },
    storageFileUrl: { type: String, default: "" },
    discipline: { type: String, default: "" },
    order: { type: Number, default: 0 },
    calibration: {
      enabled: { type: Boolean, default: false },
      scale: { type: Number, default: 0 },
      unit: { type: String, default: "ft" },
      pointA: { type: { x: Number, y: Number }, default: null },
      pointB: { type: { x: Number, y: Number }, default: null },
    },
  },
  { timestamps: true }
);

if (mongoose.models.PlanSheet) delete mongoose.models.PlanSheet;

export default model("PlanSheet", PlanSheetSchema);
