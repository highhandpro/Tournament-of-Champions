import mongoose, { Document, Schema } from "mongoose";

export interface IAdminDismissals extends Document {
  adminEmail: string;
  seenEventIds: string[];
  dismissedDays: string[];
}

const adminDismissalsSchema = new Schema<IAdminDismissals>(
  {
    adminEmail: { type: String, required: true, unique: true },
    seenEventIds: { type: [String], default: [] },
    dismissedDays: { type: [String], default: [] },
  },
  { timestamps: true },
);

export default mongoose.models.AdminDismissals ||
  mongoose.model<IAdminDismissals>("AdminDismissals", adminDismissalsSchema);
