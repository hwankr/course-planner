/**
 * Course Model
 * @api-separable
 * @migration-notes 분리 시 백엔드 프로젝트의 models/Course.ts로 이동
 */

import mongoose, { Schema, Model } from 'mongoose';
import type { ICourse, Semester } from '@/types';

export interface ICourseDocument extends Omit<ICourse, '_id'>, mongoose.Document {}

const courseSchema = new Schema<ICourseDocument>(
  {
    code: {
      type: String,
      required: [true, '과목 코드는 필수입니다.'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, '과목명은 필수입니다.'],
      trim: true,
    },
    credits: {
      type: Number,
      required: [true, '학점은 필수입니다.'],
      min: [1, '학점은 1 이상이어야 합니다.'],
      max: [6, '학점은 6 이하여야 합니다.'],
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, '학과는 필수입니다.'],
    },
    prerequisites: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    description: {
      type: String,
      trim: true,
    },
    semesters: [
      {
        type: String,
        enum: ['spring', 'summer', 'fall', 'winter'] as Semester[],
      },
    ],
    category: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// 인덱스 (code는 unique: true로 자동 생성)
courseSchema.index({ department: 1 });
courseSchema.index({ name: 'text', code: 'text' }); // 텍스트 검색용
courseSchema.index({ category: 1, department: 1 });

const Course: Model<ICourseDocument> =
  mongoose.models.Course || mongoose.model<ICourseDocument>('Course', courseSchema);

export default Course;
