/**
 * AcademicEvent Model (학사 일정)
 * @api-separable
 * @migration-notes 분리 시 백엔드 프로젝트의 models/AcademicEvent.ts로 이동
 */

import mongoose, { Schema, Model } from 'mongoose';
import type { IAcademicEvent } from '@/types';

export interface IAcademicEventDocument extends Omit<IAcademicEvent, '_id'>, mongoose.Document {}

const academicEventSchema = new Schema<IAcademicEventDocument>(
  {
    title: {
      type: String,
      required: [true, '일정 제목은 필수입니다.'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, '시작 날짜는 필수입니다.'],
    },
    endDate: {
      type: Date,
    },
    category: {
      type: String,
      enum: ['academic', 'registration', 'exam', 'holiday', 'other'],
      default: 'academic',
    },
    color: {
      type: String,
      trim: true,
    },
    isHoliday: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// 인덱스
academicEventSchema.index({ startDate: 1 });
academicEventSchema.index({ endDate: 1 });
academicEventSchema.index({ category: 1 });
academicEventSchema.index({ startDate: 1, endDate: 1 });

const AcademicEvent: Model<IAcademicEventDocument> =
  mongoose.models.AcademicEvent || mongoose.model<IAcademicEventDocument>('AcademicEvent', academicEventSchema);

export default AcademicEvent;
