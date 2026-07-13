import mongoose, { Schema, model } from "mongoose";

const AppSettingsSchema = new Schema(
  {
    tasksEnabled: { type: Boolean, default: true },
    budgetsEnabled: { type: Boolean, default: true },
    risksIssueLogEnabled: { type: Boolean, default: true },
    changeManagementEnabled: { type: Boolean, default: true },
    rfiEnabled: { type: Boolean, default: true },
    submittalsEnabled: { type: Boolean, default: true },
    punchListEnabled: { type: Boolean, default: true },
    geminiApiKey: { type: String, default: "" },
    geminiModel: { type: String, default: "gemini-2.0-flash-lite" },
    googleClientId: { type: String, default: "" },
    googleClientSecret: { type: String, default: "" },
  },
  { timestamps: true }
);

if (mongoose.models.AppSettings) {
  delete mongoose.models.AppSettings;
}

const AppSettings = model("AppSettings", AppSettingsSchema);

export default AppSettings;
