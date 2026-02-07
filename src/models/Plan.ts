/**
 * Plan Model
 * @api-separable
 * @migration-notes 분리 시 백엔드 프로젝트의 models/Plan.ts로 이동
 */

import mongoose, { Schema, Model } from 'mongoose';
import type { IPlan, Term } from '@/types';

export interface IPlanDocument extends Omit<IPlan, '_id'>, mongoose.Document {}

const plannedCourseSchema = new Schema(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    status: {
      type: String,
      enum: ['planned', 'enrolled', 'completed', 'failed'],
      default: 'planned',
    },
    grade: {
      type: String,
    },
  },
  { _id: false }
);

const semesterPlanSchema = new Schema(
  {
    year: {
      type: Number,
      required: true,
    },
    term: {
      type: String,
      enum: ['spring', 'fall'] as Term[],
      required: true,
    },
    courses: [plannedCourseSchema],
  },
  { _id: false }
);

const planSchema = new Schema<IPlanDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '사용자는 필수입니다.'],
    },
    name: {
      type: String,
      default: '내 수강계획',
      trim: true,
    },
    semesters: [semesterPlanSchema],
  },
  {
    timestamps: true,
  }
);

// 인덱스: 사용자당 단일 계획
planSchema.index({ user: 1 }, { unique: true });

const Plan: Model<IPlanDocument> =
  mongoose.models.Plan || mongoose.model<IPlanDocument>('Plan', planSchema);

export default Plan;
