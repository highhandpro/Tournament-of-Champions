import mongoose, { Document, Schema } from 'mongoose';

export type EventStatus = 'ACTIVE' | 'ARCHIVED';

export interface IEvent extends Document {
  title: string;
  dateTime: Date;
  location: string;
  host?: mongoose.Types.ObjectId;
  announcementTier1At?: Date;
  announcementTier2At?: Date;
  announcementPostAt?: Date;
  reminderAt?: Date;
  announcementTier1Sent?: boolean;
  announcementTier2Sent?: boolean;
  announcementPostSent?: boolean;
  reminderSent?: boolean;
  buyInMin?: number;
  buyInMax?: number;
  hospitalityFee?: number;
  maxPlayers: number;
  eventType: string;
  blinds?: string;
  status: EventStatus;
  registeredPlayers: mongoose.Types.ObjectId[];
  invitedPlayers: mongoose.Types.ObjectId[];
  waitlist: mongoose.Types.ObjectId[];
  announcementSent?: boolean;
  gameTitle?: string;
  gameDescription?: string;
  gameRules?: string[];
  gameNote?: string;
  details?: string;
  details1?: string;
  details2?: string;
  details3?: string;
  links?: { label: string; url: string }[];
  bannerImageUrl?: string;
  bannerImagePublicId?: string;
  cardBgColor?: string;
  doNotAnnounce?: boolean;
  isPrivate?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  dateTime: {
    type: Date,
    required: [true, 'Event date and time is required']
  },
  location: {
    type: String,
    required: [true, 'Event location is required'],
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  host: {
    type: Schema.Types.ObjectId,
    ref: 'Host',
    required: false
  },
  announcementTier1At: {
    type: Date,
    required: false
  },
  announcementTier2At: {
    type: Date,
    required: false
  },
  announcementPostAt: {
    type: Date,
    required: false
  },
  reminderAt: {
    type: Date,
    required: false
  },
  announcementTier1Sent: { type: Boolean, default: false },
  announcementTier2Sent: { type: Boolean, default: false },
  announcementPostSent: { type: Boolean, default: false },
  reminderSent: { type: Boolean, default: false },
  buyInMin: {
    type: Number,
    min: [0, 'Buy-in cannot be negative']
  },
  buyInMax: {
    type: Number,
    min: [0, 'Buy-in cannot be negative']
  },
  hospitalityFee: {
    type: Number,
    default: 0
  },
  maxPlayers: {
    type: Number,
    required: [true, 'Maximum players is required'],
    min: [1, 'Must allow at least 1 player'],
    max: [100, 'Cannot exceed 100 players']
  },
  eventType: {
    type: String,
    required: [true, 'Event type is required'],
    trim: true,
    maxlength: [50, 'Event type cannot exceed 50 characters']
  },
  blinds: {
    type: String,
    trim: true,
    maxlength: [50, 'Blinds description cannot exceed 50 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['ACTIVE', 'ARCHIVED'] as EventStatus[],
      message: 'Status must be either ACTIVE or ARCHIVED'
    },
    default: 'ACTIVE'
  },
  registeredPlayers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  invitedPlayers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  waitlist: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  announcementSent: {
    type: Boolean,
    default: false
  },
  gameTitle: {
    type: String,
    trim: true,
    maxlength: [100, 'Game title cannot exceed 100 characters']
  },
  gameDescription: {
    type: String,
    trim: true,
    maxlength: [500, 'Game description cannot exceed 500 characters']
  },
  gameRules: [{
    type: String,
    trim: true,
    maxlength: [200, 'Each game rule cannot exceed 200 characters']
  }],
  gameNote: {
    type: String,
    trim: true,
    maxlength: [200, 'Game note cannot exceed 200 characters']
  },
  details: {
    type: String,
    trim: true,
    maxlength: [500, 'Details URL cannot exceed 500 characters']
  },
  details1: {
    type: String,
    trim: true,
    maxlength: [500, 'Details 1 cannot exceed 500 characters']
  },
  details2: {
    type: String,
    trim: true,
    maxlength: [500, 'Details 2 cannot exceed 500 characters']
  },
  details3: {
    type: String,
    trim: true,
    maxlength: [500, 'Details 3 cannot exceed 500 characters']
  },
  links: [{
    label: {
      type: String,
      trim: true,
      maxlength: [100, 'Link label cannot exceed 100 characters']
    },
    url: {
      type: String,
      trim: true,
      maxlength: [500, 'Link URL cannot exceed 500 characters']
    }
  }],
  bannerImageUrl: {
    type: String,
    trim: true,
  },
  bannerImagePublicId: {
    type: String,
    trim: true,
  },
  cardBgColor: {
    type: String,
    trim: true,
    maxlength: [20, 'Card background color cannot exceed 20 characters'],
  },
  doNotAnnounce: {
    type: Boolean,
    default: false,
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true
});

// Index for faster queries
eventSchema.index({ dateTime: 1, status: 1 });
eventSchema.index({ status: 1 });

// Virtual for seats available
eventSchema.virtual('seatsAvailable').get(function(this: IEvent) {
  return this.maxPlayers - this.registeredPlayers.length;
});

// Ensure virtual fields are serialized
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

export default mongoose.models.Event || mongoose.model<IEvent>('Event', eventSchema);