import mongoose, { Schema, models, model } from "mongoose";

const CostItemSchema = new Schema(
  {
    catalogNumber: { type: Number, unique: true, sparse: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    uom: { type: String, required: true, default: "Each" },
    unitCost: { type: Number, required: true, default: 0 },
    unitPrice: { type: Number, required: true, default: 0 },
    sku: { type: String, default: "" },
    taxable: { type: Boolean, default: false },
    costGroup: {
      type: Schema.Types.ObjectId,
      ref: "CostGroup",
      required: true,
    },
  },
  { timestamps: true }
);

CostItemSchema.pre("save", async function () {
  if (!this.isNew || this.catalogNumber != null) return;
  const coll = mongoose.connection.collection("costitems");
  const last = await coll
    .find({ catalogNumber: { $exists: true } })
    .sort({ catalogNumber: -1 })
    .limit(1)
    .toArray();
  const nextNum =
    last[0]?.catalogNumber != null && typeof last[0].catalogNumber === "number"
      ? last[0].catalogNumber + 1
      : 1;
  this.set("catalogNumber", nextNum);
});

const CostItem = models.CostItem || model("CostItem", CostItemSchema);

export default CostItem;
