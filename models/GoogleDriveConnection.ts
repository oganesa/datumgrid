import mongoose, { Schema, model } from "mongoose";

const GoogleDriveConnectionSchema = new Schema(
  {
    accessToken: { type: String, default: "" },
    refreshToken: { type: String, default: "" },
    expiresAt: { type: Date, default: null },
    userEmail: { type: String, default: "" },
    connected: { type: Boolean, default: false },
  },
  { timestamps: true }
);

if (mongoose.models.GoogleDriveConnection) {
  delete mongoose.models.GoogleDriveConnection;
}

export default model("GoogleDriveConnection", GoogleDriveConnectionSchema);
