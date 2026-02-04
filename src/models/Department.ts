/**
 * Department Model
 * @api-separable
 * @migration-notes 분리 시 백엔드 프로젝트의 models/Department.ts로 이동
 */

import mongoose, { Schema, Model } from 'mongoose';
import type { IDepartment } from '@/types';

export interface IDepartmentDocument extends Omit<IDepartment, '_id'>, mongoose.Document {}

const departmentSchema = new Schema<IDepartmentDocument>(
  {
    code: {
      type: String,
      required: [true, '학과 코드는 필수입니다.'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, '학과명은 필수입니다.'],
      trim: true,
    },
    college: {
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
departmentSchema.index({ college: 1 });

const Department: Model<IDepartmentDocument> =
  mongoose.models.Department ||
  mongoose.model<IDepartmentDocument>('Department', departmentSchema);

export default Department;
