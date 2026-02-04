/**
 * Requirement Model (Graduation Requirements)
 * @api-separable
 * @migration-notes 분리 시 백엔드 프로젝트의 models/Requirement.ts로 이동
 */

import mongoose, { Schema, Model } from 'mongoose';
import type { IRequirement, RequirementCategory } from '@/types';

export interface IRequirementDocument extends Omit<IRequirement, '_id'>, mongoose.Document {}

const requirementSchema = new Schema<IRequirementDocument>(
  {
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, '학과는 필수입니다.'],
    },
    name: {
      type: String,
      required: [true, '요건 이름은 필수입니다.'],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'major_required',
        'major_elective',
        'general_required',
        'general_elective',
        'free_elective',
      ] as RequirementCategory[],
      required: [true, '카테고리는 필수입니다.'],
    },
    requiredCredits: {
      type: Number,
      required: [true, '필요 학점은 필수입니다.'],
      min: [0, '학점은 0 이상이어야 합니다.'],
    },
    description: {
      type: String,
      trim: true,
    },
    allowedCourses: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// 인덱스
requirementSchema.index({ department: 1 });
requirementSchema.index({ department: 1, category: 1 });

const Requirement: Model<IRequirementDocument> =
  mongoose.models.Requirement ||
  mongoose.model<IRequirementDocument>('Requirement', requirementSchema);

export default Requirement;
