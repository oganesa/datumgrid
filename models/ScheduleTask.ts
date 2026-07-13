import mongoose, { Schema, model } from "mongoose";

const PredecessorSchema = new Schema(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "ScheduleTask", required: true },
    type: { type: String, enum: ["FS", "FF", "SS", "SF"], default: "FS" },
    lag: { type: Number, default: 0 },
  },
  { _id: false }
);

const ScheduleTaskSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    order: { type: Number, required: true },
    outlineLevel: { type: Number, default: 0 },
    parentId: { type: Schema.Types.ObjectId, ref: "ScheduleTask", default: null },
    taskName: { type: String, default: "New Task" },
    taskMode: { type: String, enum: ["auto", "manual"], default: "auto" },
    isMilestone: { type: Boolean, default: false },
    status: { type: String, default: "not-started" },
    percentComplete: { type: Number, default: 0, min: 0, max: 100 },
    startDate: { type: Date, default: null },
    finishDate: { type: Date, default: null },
    duration: { type: Number, default: 1 },
    predecessors: { type: [PredecessorSchema], default: [] },
    resourceNames: { type: [String], default: [] },
    notes: { type: String, default: "" },
    isCollapsed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

if (mongoose.models.ScheduleTask) {
  delete mongoose.models.ScheduleTask;
}

const ScheduleTask = model("ScheduleTask", ScheduleTaskSchema);

export default ScheduleTask;
