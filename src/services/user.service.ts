/**
 * User Service
 * @api-separable
 * @migration-notes 분리 시 백엔드로 이동. HTTP 의존성 없음.
 */

import bcrypt from 'bcryptjs';
import type { ClientSession } from 'mongoose';
import { connectDB } from '@/lib/db/mongoose';
import { AdminSecurityState, User } from '@/models';
import type { IUserDocument } from '@/models';
import type { CreateUserInput, MajorType } from '@/types';
import { planService } from './plan.service';
import { courseService } from './course.service';
import { graduationRequirementService } from './graduationRequirement.service';
import { feedbackService } from './feedback.service';
import { patchNoteService } from './patchNote.service';
import { UserSecurityError } from './user-security.error';

const ADMIN_MEMBERSHIP_GUARD_ID = 'admin-membership';

async function ensureAdminMembershipGuard(): Promise<void> {
  await AdminSecurityState.updateOne(
    { _id: ADMIN_MEMBERSHIP_GUARD_ID },
    { $setOnInsert: { revision: 0 } },
    { upsert: true }
  );
}

async function withAdminMembershipTransaction<T>(
  operation: (session: ClientSession) => Promise<T>
): Promise<T> {
  const db = await connectDB();
  await ensureAdminMembershipGuard();
  const session = await db.startSession();

  try {
    let value!: T;
    await session.withTransaction(
      async () => {
        await AdminSecurityState.updateOne(
          { _id: ADMIN_MEMBERSHIP_GUARD_ID },
          { $inc: { revision: 1 } },
          { session }
        );
        value = await operation(session);
      },
      {
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
      }
    );
    return value;
  } finally {
    await session.endSession();
  }
}

async function requireAnotherAdministrator(
  targetUserId: string,
  session: ClientSession
): Promise<void> {
  const anotherAdmin = await User.exists({
    _id: { $ne: targetUserId },
    role: 'admin',
  }).session(session);

  if (!anotherAdmin) {
    throw new UserSecurityError(
      'LAST_ADMIN',
      '마지막 관리자는 강등하거나 삭제할 수 없습니다.'
    );
  }
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
 * 사용자 정보 업데이트
 */
async function update(
  id: string,
  data: Partial<Pick<CreateUserInput, 'name' | 'department' | 'enrollmentYear'> & {
    onboardingCompleted: boolean;
    majorType: MajorType;
    secondaryDepartment?: string;
    curriculumYear?: number;
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
async function deleteWithCascade(userId: string, session: ClientSession): Promise<void> {
  // 1. 사용자의 모든 수강계획 삭제
  await planService.deleteAllByUser(userId, session);

  // 2. 사용자가 생성한 커스텀 과목 삭제
  await courseService.deleteCustomByUser(userId, session);

  // 3. 사용자의 졸업요건 삭제
  await graduationRequirementService.remove(userId, session);

  // 4. 사용자의 피드백/문의 삭제
  await feedbackService.deleteAllByUser(userId, session);

  // 5. 사용자의 업데이트 소식 읽음 기록 삭제
  await patchNoteService.deleteAllReadsByUser(userId, session);

  // 6. 사용자 문서 삭제
  const user = await User.findByIdAndDelete(userId, { session });
  if (!user) {
    throw new UserSecurityError('USER_NOT_FOUND', '사용자를 찾을 수 없습니다.');
  }
}

/**
 * 본인 계정 및 관련 데이터 모두 삭제
 */
async function deleteOwnAccount(userId: string): Promise<void> {
  await withAdminMembershipTransaction(async (session) => {
    const targetUser = await User.findById(userId).session(session).lean();
    if (!targetUser) {
      throw new UserSecurityError('USER_NOT_FOUND', '사용자를 찾을 수 없습니다.');
    }

    if (targetUser.role === 'admin') {
      await requireAnotherAdministrator(userId, session);
    }

    await deleteWithCascade(userId, session);
  });
}

/**
 * 전체 사용자 목록 조회 (관리자용)
 */
const SORT_MAP: Record<string, Record<string, 1 | -1>> = {
  recent: { createdAt: -1 },
  lastLogin: { lastLoginAt: -1 },
  name: { name: 1 },
};

async function findAllUsers(filter?: {
  search?: string;
  role?: string;
  department?: string;
  sort?: string;
}): Promise<IUserDocument[]> {
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

  if (filter?.department) {
    conditions.push({ department: filter.department });
  }

  const sortObj = SORT_MAP[filter?.sort ?? ''] ?? { createdAt: -1 };
  const query = conditions.length > 0 ? { $and: conditions } : {};
  return User.find(query)
    .populate('department', 'code name')
    .sort(sortObj)
    .limit(200)
    .lean();
}

/**
 * 사용자 역할 변경 (관리자용)
 */
async function updateRole(userId: string, role: 'student' | 'admin'): Promise<IUserDocument | null> {
  return withAdminMembershipTransaction(async (session) => {
    const targetUser = await User.findById(userId).session(session).lean();
    if (!targetUser) {
      throw new UserSecurityError('USER_NOT_FOUND', '사용자를 찾을 수 없습니다.');
    }

    if (targetUser.role === 'admin' && role !== 'admin') {
      await requireAnotherAdministrator(userId, session);
    }

    return User.findByIdAndUpdate(userId, { role }, { new: true, session })
      .populate('department', 'code name')
      .lean();
  });
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
  // 자기 자신 삭제 방지
  if (targetUserId === adminUserId) {
    throw new UserSecurityError('SELF_DELETE', '자신의 계정은 삭제할 수 없습니다.');
  }

  await withAdminMembershipTransaction(async (session) => {
    const targetUser = await User.findById(targetUserId).session(session).lean();
    if (!targetUser) {
      throw new UserSecurityError('USER_NOT_FOUND', '사용자를 찾을 수 없습니다.');
    }

    if (targetUser.role === 'admin') {
      await requireAnotherAdministrator(targetUserId, session);
    }

    await deleteWithCascade(targetUserId, session);
  });
}

export const userService = {
  findByEmail,
  findByEmailWithPassword,
  findById,
  create,
  update,
  findOrCreateOAuthUser,
  deleteOwnAccount,
  findAllUsers,
  updateRole,
  updateLastLogin,
  adminDeleteUser,
};
