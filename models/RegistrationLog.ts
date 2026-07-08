import mongoose, { Document, Schema } from 'mongoose';

export interface IRegistrationLog extends Document {
  event: mongoose.Types.ObjectId;
  eventTitle: string;
  user: mongoose.Types.ObjectId;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  action: string;
  actorUser?: mongoose.Types.ObjectId;
  actorEmail?: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const registrationLogSchema = new Schema<IRegistrationLog>(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event is required'],
      index: true,
    },
    eventTitle: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [100, 'Event title cannot exceed 100 characters'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    userFirstName: {
      type: String,
      required: [true, 'User first name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    userLastName: {
      type: String,
      required: [true, 'User last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    userEmail: {
      type: String,
      required: [true, 'User email is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
      index: true,
    },
    actorUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    actorEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

registrationLogSchema.index({ event: 1, createdAt: -1 });
registrationLogSchema.index({ user: 1, createdAt: -1 });

export default mongoose.models.RegistrationLog ||
  mongoose.model<IRegistrationLog>('RegistrationLog', registrationLogSchema);
