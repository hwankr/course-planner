/**
 * PatchNote Model
 * @api-separable
 * @migration-notes 분리 시 백엔드 프로젝트의 models/PatchNote.ts로 이동
 */
import mongoose, { Schema, Model } from 'mongoose';

export interface IPatchNote {
  _id: string;
  title: string;
  content: string;
  version?: string;
  status: 'draft' | 'published';
  publishedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPatchNoteDocument extends Omit<IPatchNote, '_id'>, mongoose.Document {}

const patchNoteSchema = new Schema<IPatchNoteDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    version: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    status: {
      type: String,
      default: 'draft',
      enum: ['draft', 'published'],
    },
    publishedAt: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

patchNoteSchema.index({ status: 1, publishedAt: -1 });
patchNoteSchema.index({ createdBy: 1 });

export const PatchNote: Model<IPatchNoteDocument> =
  mongoose.models.PatchNote || mongoose.model<IPatchNoteDocument>('PatchNote', patchNoteSchema);

export default PatchNote;
