/**
 * User Service
 * @api-separable
 * @migration-notes 분리 시 백엔드로 이동. HTTP 의존성 없음.
 */

import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db/mongoose';
import { User } from '@/models';
import type { IUserDocument } from '@/models';
import type { CreateUserInput, MajorType } from '@/types';
import { planService } from './plan.service';
import { courseService } from './course.service';
import { graduationRequirementService } from './graduationRequirement.service';
import { feedbackService } from './feedback.service';

const LOCK_TIME = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;

/**
 * Check if account is locked
 */
async function isAccountLocked(email: string): Promise<boolean> {
  await connectDB();
  const user = await User.findOne({ email: email.toLowerCase() }).select('lockUntil').lean();
  if (!user?.lockUntil) return false;
  if (new Date() > user.lockUntil) {
    // Lock expired, reset
    await User.updateOne(
      { email: email.toLowerCase() },
      { $set: { failedLoginAttempts: 0 }, $unset: { lockUntil: 1 } }
    );
    return false;
  }
  return true;
}

/**
 * Record failed login attempt
 */
async function recordFailedLogin(email: string): Promise<void> {
  await connectDB();
  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { $inc: { failedLoginAttempts: 1 } },
    { new: true, select: 'failedLoginAttempts' }
  );
  if (user && (user.failedLoginAttempts ?? 0) >= MAX_LOGIN_ATTEMPTS) {
    await User.updateOne(
      { email: email.toLowerCase() },
      { $set: { lockUntil: new Date(Date.now() + LOCK_TIME) } }
    );
  }
}

/**
 * Reset failed login attempts on successful login
 */
async function resetFailedLogins(email: string): Promise<void> {
  await connectDB();
  await User.updateOne(
    { email: email.toLowerCase() },
    { $set: { failedLoginAttempts: 0 }, $unset: { lockUntil: 1 } }
  );
}

/**
 * 이메일로 사용자 조회
 */
async function findByEmail(email: string): Promise<IUserDocument | null> {
  await connectDB();
  return User.findOne({ email: email.toLowerCase() }).lean();
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
  return User.findById(id).populate('department secondaryDepartment').lean();
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
  data: Partial<Pick<CreateUserInput, 'name' | 'department' | 'enrollmentYear'> & {
    onboardingCompleted: boolean;
    majorType: MajorType;
    secondaryDepartment?: string;
  }>
): Promise<IUserDocument | null> {
  await connectDB();
  return User.findByIdAndUpdate(id, data, { new: true })
    .populate('department secondaryDepartment');
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

/**
 * 사용자 및 관련 데이터 모두 삭제 (회원 탈퇴)
 */
async function deleteWithCascade(userId: string): Promise<void> {
  await connectDB();

  // 1. 사용자의 모든 수강계획 삭제
  await planService.deleteAllByUser(userId);

  // 2. 사용자가 생성한 커스텀 과목 삭제
  await courseService.deleteCustomByUser(userId);

  // 3. 사용자의 졸업요건 삭제
  await graduationRequirementService.remove(userId);

  // 4. 사용자의 피드백/문의 삭제
  await feedbackService.deleteAllByUser(userId);

  // 5. 사용자 문서 삭제
  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    throw new Error('사용자를 찾을 수 없습니다.');
  }
}

/**
 * 전체 사용자 목록 조회 (관리자용)
 */
async function findAllUsers(filter?: { search?: string; role?: string }): Promise<IUserDocument[]> {
  await connectDB();

  const conditions: Record<string, unknown>[] = [];

  if (filter?.search) {
    const escaped = filter.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    conditions.push({
      $or: [
        { name: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
      ],
    });
  }

  if (filter?.role) {
    conditions.push({ role: filter.role });
  }

  const query = conditions.length > 0 ? { $and: conditions } : {};
  return User.find(query)
    .populate('department', 'code name')
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
}

/**
 * 사용자 역할 변경 (관리자용)
 */
async function updateRole(userId: string, role: 'student' | 'admin'): Promise<IUserDocument | null> {
  await connectDB();
  return User.findByIdAndUpdate(userId, { role }, { new: true })
    .populate('department', 'code name')
    .lean();
}

/**
 * 마지막 접속 시간 업데이트 (로그인 시 호출)
 */
async function updateLastLogin(userId: string): Promise<void> {
  await connectDB();
  await User.updateOne({ _id: userId }, { $set: { lastLoginAt: new Date() } });
}

/**
 * 관리자용 사용자 삭제 (안전장치 포함)
 */
async function adminDeleteUser(targetUserId: string, adminUserId: string): Promise<void> {
  await connectDB();

  // 자기 자신 삭제 방지
  if (targetUserId === adminUserId) {
    throw new Error('자신의 계정은 삭제할 수 없습니다.');
  }

  // 대상 사용자 확인
  const targetUser = await User.findById(targetUserId).lean();
  if (!targetUser) {
    throw new Error('사용자를 찾을 수 없습니다.');
  }

  // 마지막 관리자 삭제 방지
  if (targetUser.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      throw new Error('마지막 관리자는 삭제할 수 없습니다.');
    }
  }

  await deleteWithCascade(targetUserId);
}

export const userService = {
  findByEmail,
  findByEmailWithPassword,
  findById,
  create,
  verifyPassword,
  update,
  findOrCreateOAuthUser,
  deleteWithCascade,
  isAccountLocked,
  recordFailedLogin,
  resetFailedLogins,
  findAllUsers,
  updateRole,
  updateLastLogin,
  adminDeleteUser,
};
