/**
 * PatchNoteRead Model (per-user read tracking)
 * @api-separable
 * @migration-notes 분리 시 백엔드 프로젝트의 models/PatchNoteRead.ts로 이동
 */
import mongoose, { Schema, Model } from 'mongoose';

export interface IPatchNoteRead {
  _id: string;
  userId: mongoose.Types.ObjectId;
  patchNoteId: mongoose.Types.ObjectId;
  readAt: Date;
}

export interface IPatchNoteReadDocument extends Omit<IPatchNoteRead, '_id'>, mongoose.Document {}

const patchNoteReadSchema = new Schema<IPatchNoteReadDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    patchNoteId: {
      type: Schema.Types.ObjectId,
      ref: 'PatchNote',
      required: true,
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

patchNoteReadSchema.index({ userId: 1, patchNoteId: 1 }, { unique: true });
patchNoteReadSchema.index({ patchNoteId: 1 });

export const PatchNoteRead: Model<IPatchNoteReadDocument> =
  mongoose.models.PatchNoteRead || mongoose.model<IPatchNoteReadDocument>('PatchNoteRead', patchNoteReadSchema);

export default PatchNoteRead;
