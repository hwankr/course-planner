/**
 * Statistics Service
 * @api-separable
 * @migration-notes 분리 시 백엔드로 이동. HTTP 의존성 없음.
 */

import crypto from 'crypto';
import { connectDB } from '@/lib/db/mongoose';
import { User, Plan, Department } from '@/models';
import { statsCache } from '@/lib/cache';
import type {
  DepartmentCourseStats,
  AnonymousPlanSummary,
  AnonymousPlanDetail,
  CourseStat,
  SemesterDistribution,
} from '@/types';

const STATS_TTL = 10 * 60 * 1000;  // 10 minutes
const PLANS_TTL = 10 * 60 * 1000;  // 10 minutes
const DETAIL_TTL = 30 * 60 * 1000; // 30 minutes

interface PlansCache {
  plans: AnonymousPlanSummary[];
  idMapping: Map<string, string>;  // anonymousId -> planObjectId
  total: number;
}

/**
 * 학과별 과목 수강 통계 조회
 */
async function getDepartmentCourseStats(
  departmentId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _excludeUserId?: string
): Promise<DepartmentCourseStats | null> {
  const cacheKey = `dept-stats:${departmentId}`;
  const cached = statsCache.get<DepartmentCourseStats>(cacheKey);
  if (cached) return cached;

  await connectDB();

  // 1. Get userIds in this department
  const users = await User.find(
    { department: departmentId },
    { _id: 1 }
  ).lean();
  const userIds = users.map((u) => u._id);

  // 2. Get department info
  const department = await Department.findById(departmentId).lean();
  if (!department) return null;

  // 4. Course statistics aggregation pipeline
  const courseStatsRaw = await Plan.aggregate([
    { $match: { user: { $in: userIds } } },
    { $unwind: '$semesters' },
    { $unwind: '$semesters.courses' },
    // Lookup course info BEFORE group to filter custom courses
    {
      $lookup: {
        from: 'courses',
        localField: 'semesters.courses.course',
        foreignField: '_id',
        as: 'courseInfo',
      },
    },
    { $unwind: '$courseInfo' },
    // Filter out custom courses (createdBy !== null)
    { $match: { 'courseInfo.createdBy': null } },
    // Filter out common courses (no department) to prevent them from dominating rankings
    { $match: { 'courseInfo.department': { $ne: null } } },
    // Lookup DepartmentCurriculum for authoritative category (covers old plans without PlannedCourse.category)
    {
      $lookup: {
        from: 'departmentcurriculums',
        let: { courseId: '$courseInfo._id', deptId: { $toObjectId: departmentId } },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ['$course', '$$courseId'] }, { $eq: ['$department', '$$deptId'] }] } } },
          { $limit: 1 },
        ],
        as: 'curriculumInfo',
      },
    },
    // Group by course, collect unique students
    {
      $group: {
        _id: '$courseInfo._id',
        code: { $first: '$courseInfo.code' },
        name: { $first: '$courseInfo.name' },
        credits: { $first: '$courseInfo.credits' },
        category: { $first: { $ifNull: ['$semesters.courses.category', { $arrayElemAt: ['$curriculumInfo.category', 0] }, '$courseInfo.category'] } },
        uniqueStudents: { $addToSet: '$user' },
        semesters: { $addToSet: { year: '$semesters.year', term: '$semesters.term' } },
      },
    },
    // Project to compute studentCount from unique students
    {
      $project: {
        _id: 1,
        code: 1,
        name: 1,
        credits: 1,
        category: 1,
        studentCount: { $size: '$uniqueStudents' },
        semesters: 1,
      },
    },
    { $sort: { studentCount: -1 } },
    { $limit: 50 },
  ]);

  const totalStudents = userIds.length;
  const courseStats: CourseStat[] = courseStatsRaw.map((c) => ({
    courseId: c._id.toString(),
    code: c.code,
    name: c.name,
    credits: c.credits,
    category: c.category || 'free_elective',
    studentCount: c.studentCount,
    percentage: Math.round((c.studentCount / totalStudents) * 1000) / 10,
    semesters: (c.semesters || []).sort(
      (a: { year: number; term: string }, b: { year: number; term: string }) =>
        a.year - b.year || (a.term === 'spring' ? -1 : 1)
    ),
  }));

  // 5. Semester distribution aggregation
  const semesterDistRaw = await Plan.aggregate([
    { $match: { user: { $in: userIds } } },
    { $unwind: '$semesters' },
    { $unwind: '$semesters.courses' },
    {
      $lookup: {
        from: 'courses',
        localField: 'semesters.courses.course',
        foreignField: '_id',
        as: 'courseInfo',
      },
    },
    { $unwind: '$courseInfo' },
    { $match: { 'courseInfo.createdBy': null } },
    // Filter out common courses (no department) to prevent them from dominating rankings
    { $match: { 'courseInfo.department': { $ne: null } } },
    {
      $group: {
        _id: {
          planUser: '$user',
          year: '$semesters.year',
          term: '$semesters.term',
        },
        courseCount: { $sum: 1 },
        totalCredits: { $sum: '$courseInfo.credits' },
      },
    },
    {
      $group: {
        _id: { year: '$_id.year', term: '$_id.term' },
        avgCourses: { $avg: '$courseCount' },
        avgCredits: { $avg: '$totalCredits' },
      },
    },
    { $sort: { '_id.year': 1, '_id.term': 1 } },
  ]);

  const semesterDistribution: SemesterDistribution[] = semesterDistRaw.map(
    (s) => ({
      year: s._id.year,
      term: s._id.term,
      avgCourses: Math.round(s.avgCourses * 10) / 10,
      avgCredits: Math.round(s.avgCredits * 10) / 10,
    })
  );

  const result: DepartmentCourseStats = {
    departmentId: departmentId,
    departmentName: department.name,
    totalStudents,
    updatedAt: new Date().toISOString(),
    courseStats,
    semesterDistribution,
  };

  statsCache.set(cacheKey, result, STATS_TTL);
  return result;
}

/**
 * 같은 학과 익명 계획 목록 (offset 기반 페이지네이션)
 */
async function getAnonymousPlans(
  departmentId: string,
  excludeUserId: string,
  page: number,
  limit: number
): Promise<{ plans: AnonymousPlanSummary[]; total: number; page: number; limit: number }> {
  const cacheKey = `dept-plans:${departmentId}`;
  let cached = statsCache.get<PlansCache>(cacheKey);

  if (!cached) {
    await connectDB();

    // Get all userIds in department (excluding self)
    const users = await User.find(
      { department: departmentId },
      { _id: 1 }
    ).lean();
    const userIds = users.map((u) => u._id);

    // Get plans with populated courses (only official courses)
    const plans = await Plan.find({ user: { $in: userIds } })
      .populate({
        path: 'semesters.courses.course',
        select: 'code name credits category createdBy',
      })
      .lean();

    // Build anonymous ID mapping and summaries
    const idMapping = new Map<string, string>();
    const summaries: AnonymousPlanSummary[] = [];

    for (const plan of plans) {
      const anonymousId = crypto.randomUUID();
      idMapping.set(anonymousId, String(plan._id));

      // Calculate totals (only official courses)
      let totalCredits = 0;
      let totalCourses = 0;
      let semesterCount = 0;

      for (const semester of plan.semesters) {
        let hasCourses = false;
        for (const pc of semester.courses) {
          const course = pc.course as unknown as { code: string; name: string; credits: number; category?: string; createdBy?: unknown };
          if (course && course.createdBy == null) {
            totalCredits += course.credits || 0;
            totalCourses++;
            hasCourses = true;
          }
        }
        if (hasCourses) semesterCount++;
      }

      if (totalCourses > 0) {
        summaries.push({
          anonymousId,
          totalCredits,
          totalCourses,
          semesterCount,
        });
      }
    }

    cached = {
      plans: summaries,
      idMapping,
      total: summaries.length,
    };

    statsCache.set(cacheKey, cached, PLANS_TTL);
  }

  // Filter out self (if in cached data — self might be in cache from another user's request)
  // Apply offset-based pagination
  const start = (page - 1) * limit;
  const paginatedPlans = cached.plans.slice(start, start + limit);

  return {
    plans: paginatedPlans,
    total: cached.total,
    page,
    limit,
  };
}

/**
 * 익명 계획 상세 조회
 */
async function getAnonymousPlanDetail(
  anonymousId: string,
  departmentId: string
): Promise<AnonymousPlanDetail | null> {
  // Check detail cache first
  const detailCacheKey = `anon-plan-detail:${anonymousId}`;
  const cachedDetail = statsCache.get<AnonymousPlanDetail>(detailCacheKey);
  if (cachedDetail) return cachedDetail;

  // Resolve anonymousId -> planObjectId via plans cache
  const plansCacheKey = `dept-plans:${departmentId}`;
  const plansCache = statsCache.get<PlansCache>(plansCacheKey);

  // If plans cache expired, we can't resolve the ID
  if (!plansCache) {
    return null;
  }

  const planObjectId = plansCache.idMapping.get(anonymousId);
  if (!planObjectId) {
    return null;
  }

  await connectDB();

  const plan = await Plan.findById(planObjectId)
    .populate({
      path: 'semesters.courses.course',
      select: 'code name credits category createdBy',
    })
    .lean();

  if (!plan) return null;

  // Batch lookup DepartmentCurriculum for all courses in this plan (covers old plans without PlannedCourse.category)
  const allCourseIds = plan.semesters.flatMap((sem) =>
    sem.courses.map((pc) => {
      const course = pc.course as unknown as { _id: string };
      return course?._id;
    }).filter(Boolean)
  ) as string[];
  const curriculumEntries = await (await import('@/models')).DepartmentCurriculum
    .find({ department: departmentId, course: { $in: allCourseIds } })
    .select('course category')
    .lean<Array<{ course: { toString(): string }; category: string }>>();
  const curriculumMap = new Map(curriculumEntries.map((e) => [e.course.toString(), e.category]));

  // Build detail (filter out custom courses, strip all user info)
  const semesters = plan.semesters
    .map((sem) => ({
      year: sem.year,
      term: sem.term as string,
      courses: sem.courses
        .filter((pc) => {
          const course = pc.course as unknown as { createdBy?: unknown };
          return course && course.createdBy == null;
        })
        .map((pc) => {
          const course = pc.course as unknown as { _id: { toString(): string }; code: string; name: string; credits: number; category?: string };
          const pcCategory = (pc as unknown as { category?: string }).category;
          const currCategory = curriculumMap.get(course._id.toString());
          return {
            code: course.code,
            name: course.name,
            credits: course.credits,
            category: pcCategory || currCategory || course.category || 'free_elective',
          };
        }),
    }))
    .filter((sem) => sem.courses.length > 0)
    .sort((a, b) => a.year - b.year || (a.term === 'spring' ? -1 : 1));

  const totalCredits = semesters.reduce(
    (sum, sem) => sum + sem.courses.reduce((s, c) => s + c.credits, 0),
    0
  );

  const result: AnonymousPlanDetail = {
    anonymousId,
    semesters,
    totalCredits,
  };

  statsCache.set(detailCacheKey, result, DETAIL_TTL);
  return result;
}

export const statisticsService = {
  getDepartmentCourseStats,
  getAnonymousPlans,
  getAnonymousPlanDetail,
};
