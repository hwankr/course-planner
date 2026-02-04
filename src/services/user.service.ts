/**
 * User Service
 * @api-separable
 * @migration-notes 분리 시 백엔드로 이동. HTTP 의존성 없음.
 */

import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db/mongoose';
import { User } from '@/models';
import type { IUserDocument } from '@/models';
import type { CreateUserInput } from '@/types';

/**
 * 이메일로 사용자 조회
 */
async function findByEmail(email: string): Promise<IUserDocument | null> {
  await connectDB();
  return User.findOne({ email: email.toLowerCase() });
}

/**
 * 이메일로 사용자 조회 (비밀번호 포함)
 */
async function findByEmailWithPassword(email: string): Promise<IUserDocument | null> {
  await connectDB();
  return User.findOne({ email: email.toLowerCase() }).select('+password');
}

/**
 * ID로 사용자 조회
 */
async function findById(id: string): Promise<IUserDocument | null> {
  await connectDB();
  return User.findById(id).populate('department');
}

/**
 * 새 사용자 생성
 */
async function create(input: CreateUserInput): Promise<IUserDocument> {
  await connectDB();

  const existingUser = await User.findOne({ email: input.email.toLowerCase() });
  if (existingUser) {
    throw new Error('이미 등록된 이메일입니다.');
  }

  let hashedPassword: string | undefined;
  if (input.password) {
    hashedPassword = await bcrypt.hash(input.password, 12);
  }

  const user = await User.create({
    ...input,
    email: input.email.toLowerCase(),
    password: hashedPassword,
  });

  return user;
}

/**
 * 비밀번호 검증
 */
async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * 사용자 정보 업데이트
 */
async function update(
  id: string,
  data: Partial<Pick<CreateUserInput, 'name' | 'department' | 'enrollmentYear'>>
): Promise<IUserDocument | null> {
  await connectDB();
  return User.findByIdAndUpdate(id, data, { new: true }).populate('department');
}

/**
 * OAuth 사용자 조회 또는 생성
 */
async function findOrCreateOAuthUser(
  email: string,
  name: string,
  image?: string
): Promise<IUserDocument> {
  await connectDB();

  let user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    user = await User.create({
      email: email.toLowerCase(),
      name,
      image,
      provider: 'google',
    });
  } else if (user.provider !== 'google') {
    // 기존 credentials 사용자가 OAuth로 로그인 시도
    throw new Error('이미 이메일/비밀번호로 가입된 계정입니다.');
  }

  return user;
}

export const userService = {
  findByEmail,
  findByEmailWithPassword,
  findById,
  create,
  verifyPassword,
  update,
  findOrCreateOAuthUser,
};
