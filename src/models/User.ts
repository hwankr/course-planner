/**
 * User Model
 * @api-separable
 * @migration-notes 분리 시 백엔드 프로젝트의 models/User.ts로 이동
 */

import mongoose, { Schema, Model } from 'mongoose';
import type { IUser, UserRole } from '@/types';

export interface IUserDocument extends Omit<IUser, '_id'>, mongoose.Document {}

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: [true, '이메일은 필수입니다.'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false, // 기본적으로 비밀번호 제외
    },
    name: {
      type: String,
      required: [true, '이름은 필수입니다.'],
      trim: true,
    },
    image: {
      type: String,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    enrollmentYear: {
      type: Number,
    },
    role: {
      type: String,
      enum: ['student', 'admin'] as UserRole[],
      default: 'student',
    },
    provider: {
      type: String,
      enum: ['credentials', 'google'],
      default: 'credentials',
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    majorType: {
      type: String,
      enum: ['single', 'double', 'minor'],
      default: 'single',
    },
    secondaryDepartment: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
  },
  {
    timestamps: true,
  }
);

// 인덱스 (email은 unique: true로 자동 생성)
userSchema.index({ department: 1 });
userSchema.index({ secondaryDepartment: 1 });

// 비밀번호 포함 조회 메서드
userSchema.statics.findByEmailWithPassword = function (email: string) {
  return this.findOne({ email }).select('+password');
};

const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>('User', userSchema);

export default User;
