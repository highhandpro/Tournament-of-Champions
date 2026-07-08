import mongoose, { Document, Schema } from 'mongoose';

export type PhotoApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface IPhoto extends Document {
  uploadedBy: mongoose.Types.ObjectId;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  approvalStatus: PhotoApprovalStatus;
  caption?: string;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const photoSchema = new Schema<IPhoto>({
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader is required'],
  },
  cloudinaryPublicId: {
    type: String,
    required: [true, 'Cloudinary public ID is required'],
  },
  cloudinaryUrl: {
    type: String,
    required: [true, 'Cloudinary URL is required'],
  },
  originalName: {
    type: String,
    required: [true, 'Original filename is required'],
    trim: true,
    maxlength: [255, 'Filename cannot exceed 255 characters'],
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required'],
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required'],
    enum: {
      values: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      message: 'Only JPEG, PNG, WebP, and GIF images are allowed',
    },
  },
  approvalStatus: {
    type: String,
    enum: {
      values: ['PENDING', 'APPROVED', 'REJECTED'] as PhotoApprovalStatus[],
      message: 'Approval status must be PENDING, APPROVED, or REJECTED',
    },
    default: 'PENDING',
  },
  caption: {
    type: String,
    trim: true,
    maxlength: [500, 'Caption cannot exceed 500 characters'],
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

photoSchema.index({ approvalStatus: 1, createdAt: -1 });
photoSchema.index({ uploadedBy: 1 });

export default mongoose.models.Photo || mongoose.model<IPhoto>('Photo', photoSchema);
