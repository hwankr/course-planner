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
  adminReply?: string;           // 관리자 답변 메시지
  adminReplyAt?: Date;           // 관리자 답변 시각
  isReadByAdmin: boolean;        // 관리자가 읽었는지 (default: false)
  isReadByUser: boolean;         // 사용자가 관리자 답변을 읽었는지 (default: true, 답변 달리면 false로)
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
    adminReply: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    adminReplyAt: {
      type: Date,
    },
    isReadByAdmin: {
      type: Boolean,
      default: false,
    },
    isReadByUser: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient admin queries
feedbackSchema.index({ status: 1, createdAt: -1 });
feedbackSchema.index({ category: 1, status: 1, createdAt: -1 });
feedbackSchema.index({ userId: 1, createdAt: -1 });
feedbackSchema.index({ isReadByAdmin: 1, status: 1 });
feedbackSchema.index({ userId: 1, isReadByUser: 1 });

export const Feedback: Model<IFeedbackDocument> =
  mongoose.models.Feedback || mongoose.model<IFeedbackDocument>('Feedback', feedbackSchema);
