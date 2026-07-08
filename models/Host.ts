import mongoose, { Document, Schema } from 'mongoose';

export interface IHost extends Document {
  user: mongoose.Types.ObjectId;
  address: string;
  tier1: mongoose.Types.ObjectId[];
  tier2: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const HostSchema = new Schema<IHost>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, 'User is required'],
  },
  address: {
    type: String,
    required: false,
  },
  tier1: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  tier2: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
}, {
  timestamps: true
});

export default mongoose.models.Host || mongoose.model<IHost>('Host', HostSchema);