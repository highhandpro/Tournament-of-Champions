import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailLogDetail {
  eventId?: string;
  eventTitle: string;
  type: string;
  subject?: string;
  emailsSent: number;
  recipients?: { name: string; email: string }[];
}

export interface IEmailLog extends Document {
  runAt: Date;
  triggeredBy: 'cron' | 'manual' | 'github-cron' | 'in-app-manual-cron' | 'watchdog-cron';
  eventsProcessed: number;
  emailsSent: number;
  details: IEmailLogDetail[];
  error?: string;
  success: boolean;
}

const emailLogSchema = new Schema<IEmailLog>({
  runAt: { type: Date, required: true, default: Date.now },
  triggeredBy: {
    type: String,
    enum: ['cron', 'manual', 'github-cron', 'in-app-manual-cron', 'watchdog-cron'],
    required: true,
  },
  eventsProcessed: { type: Number, default: 0 },
  emailsSent: { type: Number, default: 0 },
  details: [
    {
      eventId: { type: String },
      eventTitle: { type: String, required: true },
      type: { type: String, required: true },
      subject: { type: String },
      emailsSent: { type: Number, default: 0 },
      recipients: [{ name: { type: String }, email: { type: String } }],
    },
  ],
  error: { type: String },
  success: { type: Boolean, required: true },
});

export default mongoose.models.EmailLog ||
  mongoose.model<IEmailLog>('EmailLog', emailLogSchema);
