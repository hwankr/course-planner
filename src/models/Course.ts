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
      max: [12, '학점은 12 이하여야 합니다.'],
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
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
      enum: ['major_required', 'major_compulsory', 'major_elective', 'general_required', 'general_elective', 'free_elective', 'teaching'],
      trim: true,
    },
    recommendedYear: {
      type: Number,
      min: [1, '학년은 1 이상이어야 합니다.'],
      max: [6, '학년은 6 이하여야 합니다.'],
    },
    recommendedSemester: {
      type: String,
      enum: ['spring', 'summer', 'fall', 'winter'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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

// 인덱스
courseSchema.index({ code: 1, createdBy: 1 }, { unique: true }); // 같은 코드라도 다른 사용자면 허용
courseSchema.index({ createdBy: 1 });
courseSchema.index({ department: 1 });
courseSchema.index({ name: 'text', code: 'text' }); // 텍스트 검색용
courseSchema.index({ category: 1, department: 1 });
courseSchema.index({ recommendedYear: 1, recommendedSemester: 1 });

const Course: Model<ICourseDocument> =
  mongoose.models.Course || mongoose.model<ICourseDocument>('Course', courseSchema);

export default Course;
