/**
 * GraduationRequirement Model (Single document per user)
 * @api-separable
 * @migration-notes 분리 시 백엔드 프로젝트의 models/GraduationRequirement.ts로 이동
 */

import mongoose, { Schema, Model } from 'mongoose';

export interface IGraduationRequirementDocument extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  majorType: string;

  totalCredits: number;          // 졸업학점 (예: 130)
  generalCredits: number;        // 교양학점 합계 (예: 30)

  primaryMajorCredits: number;          // 주전공 학점 합계 (예: 60)
  primaryMajorRequiredMin: number;      // 주전공 핵심 최소 (예: 24)

  secondaryMajorCredits?: number;       // 복수전공 학점 합계
  secondaryMajorRequiredMin?: number;   // 복수전공 핵심 최소

  minorCredits?: number;                // 부전공 학점 합계
  minorRequiredMin?: number;            // 부전공 핵심 최소
  minorPrimaryMajorMin?: number;        // 부전공 시 주전공 최소

  earnedTotalCredits: number;    // 기이수 졸업학점 (기타)
  earnedGeneralCredits: number;  // 기이수 교양학점

  earnedPrimaryMajorCredits: number;    // 기이수 주전공 학점
  earnedPrimaryMajorRequiredCredits: number;  // 기이수 주전공 핵심학점

  earnedSecondaryMajorCredits?: number; // 기이수 복수전공 학점
  earnedSecondaryMajorRequiredCredits?: number; // 기이수 복수전공 핵심학점

  earnedMinorCredits?: number;          // 기이수 부전공 학점
  earnedMinorRequiredCredits?: number;  // 기이수 부전공 핵심학점

  createdAt: Date;
  updatedAt: Date;
}

const graduationRequirementSchema = new Schema<IGraduationRequirementDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '사용자는 필수입니다.'],
      unique: true,
    },
    majorType: {
      type: String,
      enum: ['single', 'double', 'minor'],
      default: 'single',
    },
    totalCredits: {
      type: Number,
      required: [true, '졸업학점은 필수입니다.'],
      min: [1, '졸업학점은 1 이상이어야 합니다.'],
    },
    generalCredits: {
      type: Number,
      required: [true, '교양학점은 필수입니다.'],
      min: [0, '교양학점은 0 이상이어야 합니다.'],
    },
    primaryMajorCredits: {
      type: Number,
      required: false, // TODO: restore required:true after migration
      min: [0, '주전공 학점은 0 이상이어야 합니다.'],
    },
    primaryMajorRequiredMin: {
      type: Number,
      required: false, // TODO: restore required:true after migration
      min: [0, '주전공 핵심 최소학점은 0 이상이어야 합니다.'],
    },
    secondaryMajorCredits: {
      type: Number,
      min: [0, '복수전공 학점은 0 이상이어야 합니다.'],
    },
    secondaryMajorRequiredMin: {
      type: Number,
      min: [0, '복수전공 핵심 최소학점은 0 이상이어야 합니다.'],
    },
    minorCredits: {
      type: Number,
      min: [0, '부전공 학점은 0 이상이어야 합니다.'],
    },
    minorRequiredMin: {
      type: Number,
      min: [0, '부전공 핵심 최소학점은 0 이상이어야 합니다.'],
    },
    minorPrimaryMajorMin: {
      type: Number,
      min: [0, '부전공 시 주전공 최소학점은 0 이상이어야 합니다.'],
    },
    earnedTotalCredits: {
      type: Number,
      default: 0,
      min: [0, '기이수 졸업학점은 0 이상이어야 합니다.'],
    },
    earnedGeneralCredits: {
      type: Number,
      default: 0,
      min: [0, '기이수 교양학점은 0 이상이어야 합니다.'],
    },
    earnedPrimaryMajorCredits: {
      type: Number,
      default: 0,
      min: [0, '기이수 주전공 학점은 0 이상이어야 합니다.'],
    },
    earnedPrimaryMajorRequiredCredits: {
      type: Number,
      default: 0,
      min: [0, '기이수 주전공 핵심학점은 0 이상이어야 합니다.'],
    },
    earnedSecondaryMajorCredits: {
      type: Number,
      default: 0,
      min: [0, '기이수 복수전공 학점은 0 이상이어야 합니다.'],
    },
    earnedSecondaryMajorRequiredCredits: {
      type: Number,
      default: 0,
      min: [0, '기이수 복수전공 핵심학점은 0 이상이어야 합니다.'],
    },
    earnedMinorCredits: {
      type: Number,
      default: 0,
      min: [0, '기이수 부전공 학점은 0 이상이어야 합니다.'],
    },
    earnedMinorRequiredCredits: {
      type: Number,
      default: 0,
      min: [0, '기이수 부전공 핵심학점은 0 이상이어야 합니다.'],
    },
  },
  {
    timestamps: true,
  }
);

const GraduationRequirement: Model<IGraduationRequirementDocument> =
  mongoose.models.GraduationRequirement || mongoose.model<IGraduationRequirementDocument>('GraduationRequirement', graduationRequirementSchema);

export default GraduationRequirement;
