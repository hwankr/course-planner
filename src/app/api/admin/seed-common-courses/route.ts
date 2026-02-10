/**
 * @api-separable
 * @endpoint POST /api/admin/seed-common-courses
 * @service courseService.create (batch)
 * @migration-notes Express 변환 시: app.post('/api/admin/seed-common-courses', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db/mongoose';
import { Course } from '@/models';
import type { RequirementCategory, Semester } from '@/types';
import * as Sentry from '@sentry/nextjs';

interface CommonCourseDefinition {
  code: string;
  name: string;
  credits: number;
  category: RequirementCategory;
  semesters: Semester[];
}

const COMMON_COURSES: CommonCourseDefinition[] = [
  // 교양선택 (General Elective)
  { code: 'COM-GE-1', name: '교양선택 1학점', credits: 1, category: 'general_elective', semesters: ['spring', 'fall'] },
  { code: 'COM-GE-2', name: '교양선택 2학점', credits: 2, category: 'general_elective', semesters: ['spring', 'fall'] },
  { code: 'COM-GE-3', name: '교양선택 3학점', credits: 3, category: 'general_elective', semesters: ['spring', 'fall'] },
  // 자유선택 (Free Elective)
  { code: 'COM-FE-1', name: '자유선택 1학점', credits: 1, category: 'free_elective', semesters: ['spring', 'fall'] },
  { code: 'COM-FE-2', name: '자유선택 2학점', credits: 2, category: 'free_elective', semesters: ['spring', 'fall'] },
  { code: 'COM-FE-3', name: '자유선택 3학점', credits: 3, category: 'free_elective', semesters: ['spring', 'fall'] },
  // 교양필수 공통 (Common General Required)
  { code: 'COM-GR-1', name: '교양필수 1학점', credits: 1, category: 'general_required', semesters: ['spring', 'fall'] },
  { code: 'COM-GR-2', name: '교양필수 2학점', credits: 2, category: 'general_required', semesters: ['spring', 'fall'] },
  { code: 'COM-GR-3', name: '교양필수 3학점', credits: 3, category: 'general_required', semesters: ['spring', 'fall'] },
  // 교직 (Teaching)
  { code: 'COM-TC-2', name: '교직 2학점', credits: 2, category: 'teaching', semesters: ['spring', 'fall'] },
  { code: 'COM-TC-3', name: '교직 3학점', credits: 3, category: 'teaching', semesters: ['spring', 'fall'] },
];

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    await connectDB();

    let created = 0;
    let skipped = 0;

    for (const courseDef of COMMON_COURSES) {
      const existing = await Course.findOne({
        code: courseDef.code,
        createdBy: null,
      });

      if (existing) {
        skipped++;
        continue;
      }

      await Course.create({
        ...courseDef,
        department: undefined,
        createdBy: undefined,
        isActive: true,
      });
      created++;
    }

    return NextResponse.json({
      success: true,
      data: { created, skipped, total: COMMON_COURSES.length },
      message: `공통 과목 시드 완료: ${created}개 생성, ${skipped}개 이미 존재`,
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '공통 과목 시드에 실패했습니다.' },
      { status: 500 }
    );
  }
}
