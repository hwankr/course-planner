/**
 * Feedback Model
 * @api-separable
 * @migration-notes 분리 시 백엔드 프로젝트의 models/Feedback.ts로 이동
 */
import mongoose, { Schema, Model } from 'mongoose';

export interface IFeedback {
  _id: string;
  category: 'bug' | 'feature' | 'data-error' | 'other' | 'contact';
  message: string;
  email?: string;
  userId?: mongoose.Types.ObjectId;
  status: 'pending' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeedbackDocument extends Omit<IFeedback, '_id'>, mongoose.Document {}

const feedbackSchema = new Schema<IFeedbackDocument>(
  {
    category: {
      type: String,
      required: true,
      enum: ['bug', 'feature', 'data-error', 'other', 'contact'],
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    email: {
      type: String,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      default: 'pending',
      enum: ['pending', 'resolved'],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient admin queries
feedbackSchema.index({ status: 1, createdAt: -1 });
feedbackSchema.index({ category: 1, status: 1, createdAt: -1 });

export const Feedback: Model<IFeedbackDocument> =
  mongoose.models.Feedback || mongoose.model<IFeedbackDocument>('Feedback', feedbackSchema);
