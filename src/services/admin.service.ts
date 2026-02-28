/**
 * Admin Service
 * @api-separable
 * @migration-notes 분리 시 백엔드로 이동. HTTP 의존성 없음.
 */

import { connectDB } from '@/lib/db/mongoose';
import { Course, Department, User, Plan, DepartmentCurriculum } from '@/models';

interface AdminStats {
  courseCount: number;
  departmentCount: number;
  userCount: number;
  planCount: number;
}

async function getStats(year?: number): Promise<AdminStats> {
  await connectDB();

  const courseCountPromise = year
    ? DepartmentCurriculum.distinct('course', { year }).then(ids => ids.length)
    : Course.countDocuments({ isActive: true, createdBy: null });

  const [courseCount, departmentCount, userCount, planCount] = await Promise.all([
    courseCountPromise,
    Department.countDocuments({ isActive: true }),
    User.countDocuments(),
    Plan.countDocuments(),
  ]);

  return { courseCount, departmentCount, userCount, planCount };
}

export const adminService = { getStats };
