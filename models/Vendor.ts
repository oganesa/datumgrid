import mongoose, { Schema, models, model } from "mongoose";

const VendorSchema = new Schema(
  {
    name: { type: String, required: true },
    address1: String,
    address2: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String,
    email: String,
    web: String,
  },
  { timestamps: true }
);

const Vendor = models.Vendor || model("Vendor", VendorSchema);

export default Vendor;
