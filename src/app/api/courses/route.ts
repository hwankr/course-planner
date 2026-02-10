/**
 * @api-separable
 * @endpoint GET /api/courses - 과목 목록 조회
 * @endpoint POST /api/courses - 과목 생성 (관리자)
 * @service courseService.findAll, courseService.create
 * @migration-notes Express 변환 시: app.get('/api/courses', ...), app.post('/api/courses', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { courseService } from '@/services';
import { z } from 'zod';
import type { CourseFilter, Semester } from '@/types';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const recommendedYear = searchParams.get('recommendedYear');
    const recommendedSemester = searchParams.get('recommendedSemester');

    const filter: CourseFilter = {
      departmentId: searchParams.get('departmentId') || undefined,
      semester: searchParams.get('semester') as Semester | undefined,
      category: searchParams.get('category') as import('@/types').RequirementCategory | undefined,
      search: searchParams.get('search') || undefined,
      recommendedYear: recommendedYear ? parseInt(recommendedYear, 10) : undefined,
      recommendedSemester: recommendedSemester as Semester | undefined,
      userId: session?.user?.id, // Include user's custom courses
    };

    const courses = await courseService.findAll(filter);

    return NextResponse.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '과목 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

const createCourseSchema = z.object({
  code: z.string().min(1, '과목 코드는 필수입니다.'),
  name: z.string().min(1, '과목명은 필수입니다.'),
  credits: z.number().min(1).max(12),
  department: z.string().min(1, '학과는 필수입니다.'),
  prerequisites: z.array(z.string()).optional(),
  description: z.string().optional(),
  semesters: z.array(z.enum(['spring', 'summer', 'fall', 'winter'])),
  category: z.enum(['major_required', 'major_compulsory', 'major_elective', 'general_required', 'general_elective', 'free_elective', 'teaching']).optional(),
  recommendedYear: z.number().min(1).max(6).optional(),
  recommendedSemester: z.enum(['spring', 'summer', 'fall', 'winter']).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createCourseSchema.parse(body);

    // Non-admin: force createdBy (custom course). Admin: official course (createdBy = null)
    const courseData = {
      ...validatedData,
      createdBy: session.user.role === 'admin' ? undefined : session.user.id,
    };

    const course = await courseService.create(courseData);

    return NextResponse.json({
      success: true,
      data: course,
      message: '과목이 생성되었습니다.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '과목 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
