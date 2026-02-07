/**
 * GraduationRequirement Model (Single document per user)
 * @api-separable
 * @migration-notes 분리 시 백엔드 프로젝트의 models/GraduationRequirement.ts로 이동
 */

import mongoose, { Schema, Model } from 'mongoose';

export interface IGraduationRequirementDocument extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  totalCredits: number;          // 졸업학점 (예: 130)
  majorCredits: number;          // 전공학점 합계 (예: 60)
  majorRequiredMin: number;      // 전공핵심 최소 (예: 24)
  generalCredits: number;        // 교양학점 합계 (예: 30)
  earnedTotalCredits: number;    // 기이수 졸업학점 (기타)
  earnedMajorCredits: number;    // 기이수 전공학점
  earnedGeneralCredits: number;  // 기이수 교양학점
  earnedMajorRequiredCredits: number;  // 기이수 전공핵심학점
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
    totalCredits: {
      type: Number,
      required: [true, '졸업학점은 필수입니다.'],
      min: [1, '졸업학점은 1 이상이어야 합니다.'],
    },
    majorCredits: {
      type: Number,
      required: [true, '전공학점은 필수입니다.'],
      min: [0, '전공학점은 0 이상이어야 합니다.'],
    },
    majorRequiredMin: {
      type: Number,
      required: [true, '전공핵심 최소학점은 필수입니다.'],
      min: [0, '전공핵심 최소학점은 0 이상이어야 합니다.'],
    },
    generalCredits: {
      type: Number,
      required: [true, '교양학점은 필수입니다.'],
      min: [0, '교양학점은 0 이상이어야 합니다.'],
    },
    earnedTotalCredits: {
      type: Number,
      default: 0,
      min: [0, '기이수 졸업학점은 0 이상이어야 합니다.'],
    },
    earnedMajorCredits: {
      type: Number,
      default: 0,
      min: [0, '기이수 전공학점은 0 이상이어야 합니다.'],
    },
    earnedGeneralCredits: {
      type: Number,
      default: 0,
      min: [0, '기이수 교양학점은 0 이상이어야 합니다.'],
    },
    earnedMajorRequiredCredits: {
      type: Number,
      default: 0,
      min: [0, '기이수 전공핵심학점은 0 이상이어야 합니다.'],
    },
  },
  {
    timestamps: true,
  }
);

const GraduationRequirement: Model<IGraduationRequirementDocument> =
  mongoose.models.GraduationRequirement || mongoose.model<IGraduationRequirementDocument>('GraduationRequirement', graduationRequirementSchema);

export default GraduationRequirement;
