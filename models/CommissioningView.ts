import mongoose, { Schema, model } from "mongoose";

const FilterSchema = new Schema(
  {
    field: { type: String, required: true },
    operator: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const CommissioningViewSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    filters: { type: [FilterSchema], default: [] },
    /** Empty array = show all columns; non-empty = show only listed keys */
    columns: { type: [String], default: [] },
  },
  { timestamps: true }
);

if (mongoose.models.CommissioningView) {
  delete mongoose.models.CommissioningView;
}

const CommissioningView = model("CommissioningView", CommissioningViewSchema);
export default CommissioningView;
