import mongoose, { Schema, model } from "mongoose";

const ProjectFolderSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    folderId: { type: String, required: true },
    folderName: { type: String, required: true },
    folderUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

if (mongoose.models.ProjectFolder) delete mongoose.models.ProjectFolder;

export default model("ProjectFolder", ProjectFolderSchema);
