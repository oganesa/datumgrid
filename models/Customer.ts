import mongoose, { Schema, models, model } from "mongoose";

const CustomerSchema = new Schema(
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

const Customer =
  models.Customer || model("Customer", CustomerSchema);

export default Customer;
