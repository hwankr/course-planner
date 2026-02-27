/**
 * DepartmentCurriculum Model (Junction table: Department ↔ Course)
 * 학과별 커리큘럼 - 어떤 학과가 어떤 과목을 몇 학년 몇 학기에 이수하는지
 * @api-separable
 * @migration-notes 분리 시 백엔드 프로젝트의 models/DepartmentCurriculum.ts로 이동
 */

import mongoose, { Schema, Model } from 'mongoose';
import type { IDepartmentCurriculum, RequirementCategory } from '@/types';

export interface IDepartmentCurriculumDocument extends Omit<IDepartmentCurriculum, '_id'>, mongoose.Document {}

const departmentCurriculumSchema = new Schema<IDepartmentCurriculumDocument>(
  {
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, '학과는 필수입니다.'],
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, '과목은 필수입니다.'],
    },
    category: {
      type: String,
      enum: [
        'major_required',
        'major_compulsory',
        'major_elective',
        'general_required',
        'general_elective',
        'free_elective',
        'teaching',
      ] as RequirementCategory[],
      required: [true, '이수구분은 필수입니다.'],
    },
    recommendedYear: {
      type: Number,
      required: [true, '권장 학년은 필수입니다.'],
      min: [1, '학년은 1 이상이어야 합니다.'],
      max: [6, '학년은 6 이하여야 합니다.'],
    },
    recommendedSemester: {
      type: String,
      enum: ['spring', 'fall'],
      required: [true, '권장 학기는 필수입니다.'],
    },
    year: {
      type: Number,
      required: [true, '커리큘럼 연도는 필수입니다.'],
      min: [2020, '연도는 2020 이상이어야 합니다.'],
      max: [2100, '연도는 2100 이하여야 합니다.'],
      default: 2025,
    },
  },
  {
    timestamps: true,
  }
);

// 인덱스
departmentCurriculumSchema.index(
  { department: 1, course: 1, recommendedSemester: 1, year: 1 },
  { unique: true }
);
departmentCurriculumSchema.index({ department: 1, category: 1 });
departmentCurriculumSchema.index({ course: 1 });

const DepartmentCurriculum: Model<IDepartmentCurriculumDocument> =
  mongoose.models.DepartmentCurriculum ||
  mongoose.model<IDepartmentCurriculumDocument>('DepartmentCurriculum', departmentCurriculumSchema);

export default DepartmentCurriculum;
