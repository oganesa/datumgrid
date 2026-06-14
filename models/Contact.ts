import mongoose, { Schema, model } from "mongoose";

const ContactSchema = new Schema(
  {
    prefix:    { type: String, default: "" },
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
    title:     { type: String, default: "" },
    email:     { type: String, default: "" },
    phone:     { type: String, default: "" },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", default: null },
    vendorId:   { type: Schema.Types.ObjectId, ref: "Vendor",   default: null },
  },
  { timestamps: true }
);

if (mongoose.models.Contact) {
  delete mongoose.models.Contact;
}

export default model("Contact", ContactSchema);
