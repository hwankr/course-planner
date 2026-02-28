/**
 * DepartmentRequirement Model (Reference table - 학과별 졸업요건 기준표)
 * @api-separable
 * @migration-notes 분리 시 백엔드 프로젝트의 models/DepartmentRequirement.ts로 이동
 */

import mongoose, { Schema, Model } from 'mongoose';

export interface IDepartmentRequirementDocument extends mongoose.Document {
  college: string;
  departmentName: string;
  year: number;
  generalCredits: number | null;
  single: {
    majorRequiredMin: number | null;
    majorCredits: number | null;
  };
  double: {
    majorRequiredMin: number | null;
    majorCredits: number | null;
  };
  minor: {
    majorRequiredMin: number | null;
    majorCredits: number | null;
    primaryMajorMin: number | null;
  };
  totalCredits: number;
  availableMajorTypes: string[];
  createdAt: Date;
  updatedAt: Date;
}

const departmentRequirementSchema = new Schema<IDepartmentRequirementDocument>(
  {
    college: { type: String, required: [true, '대학명은 필수입니다.'] },
    departmentName: { type: String, required: [true, '학과명은 필수입니다.'] },
    year: { type: Number, required: true, default: 2025 },
    generalCredits: { type: Number, default: null },

    single: {
      majorRequiredMin: { type: Number, default: null },
      majorCredits: { type: Number, default: null },
    },
    double: {
      majorRequiredMin: { type: Number, default: null },
      majorCredits: { type: Number, default: null },
    },
    minor: {
      majorRequiredMin: { type: Number, default: null },
      majorCredits: { type: Number, default: null },
      primaryMajorMin: { type: Number, default: null },
    },

    totalCredits: { type: Number, required: [true, '졸업학점은 필수입니다.'] },
    availableMajorTypes: [{ type: String, enum: ['single', 'double', 'minor'] }],
  },
  { timestamps: true }
);

// Composite unique index (year-versioned)
departmentRequirementSchema.index(
  { college: 1, departmentName: 1, year: 1 },
  { unique: true }
);

// Text search support for department name
departmentRequirementSchema.index({ departmentName: 'text' });

const DepartmentRequirement: Model<IDepartmentRequirementDocument> =
  mongoose.models.DepartmentRequirement ||
  mongoose.model<IDepartmentRequirementDocument>('DepartmentRequirement', departmentRequirementSchema);

export default DepartmentRequirement;
