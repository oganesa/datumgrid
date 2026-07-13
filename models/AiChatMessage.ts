import mongoose, { Schema, model } from "mongoose";

const AiChatMessageSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, default: "" },
    // Store only metadata for attachments (name + mimeType), not the raw base64
    attachments: [{ name: String, mimeType: String }],
    scheduleData: { type: Schema.Types.Mixed, default: null },
    savedFiles: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

if (mongoose.models.AiChatMessage) delete mongoose.models.AiChatMessage;

export default model("AiChatMessage", AiChatMessageSchema);
