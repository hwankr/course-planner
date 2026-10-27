/**
 * @api-separable
 * @endpoint GET /api/courses - 과목 목록 조회
 * @endpoint POST /api/courses - 과목 생성 (관리자)
 * @service courseService.findAll, courseService.create
 * @migration-notes Express 변환 시: app.get('/api/courses', ...), app.post('/api/courses', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { isActiveAdminSession } from '@/lib/auth/admin-session';
import { authOptions } from '@/lib/auth/options';
import { courseService } from '@/services';
import { z } from 'zod';
import type { CourseFilter, Semester, RequirementCategory } from '@/types';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const recommendedYear = searchParams.get('recommendedYear');
    const recommendedSemester = searchParams.get('recommendedSemester');
    const isCommon = searchParams.get('common') === 'true';
    const category = searchParams.get('category') as RequirementCategory | undefined;
    const search = searchParams.get('search') || undefined;

    // 공통 과목 조회
    if (isCommon) {
      const courses = await courseService.findCommonCourses({
        category: category || undefined,
        search,
      });
      return NextResponse.json({ success: true, data: courses });
    }

    const curriculumYear = searchParams.get('curriculumYear');

    const filter: CourseFilter = {
      departmentId: searchParams.get('departmentId') || undefined,
      semester: searchParams.get('semester') as Semester | undefined,
      category,
      search,
      recommendedYear: recommendedYear ? parseInt(recommendedYear, 10) : undefined,
      recommendedSemester: recommendedSemester as Semester | undefined,
      curriculumYear: curriculumYear ? parseInt(curriculumYear, 10) : undefined,
      userId: session?.user?.id, // Include user's custom courses
    };

    if (searchParams.has('page')) {
      const paging = z.object({ page: z.coerce.number().int().min(1), limit: z.coerce.number().int().min(1).max(200) })
        .safeParse({ page: searchParams.get('page'), limit: searchParams.get('limit') ?? 50 });
      if (!paging.success) return NextResponse.json({ success: false, error: '페이지와 개수를 확인해주세요.' }, { status: 400 });
      const result = await courseService.findPage({ ...filter, ...paging.data });
      return NextResponse.json({ success: true, ...result });
    }
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
  official: z.boolean().optional(),
  curriculumYear: z.coerce.number().int().min(2020).max(2100).optional(),
  code: z.string().min(1, '과목 코드는 필수입니다.'),
  name: z.string().min(1, '과목명은 필수입니다.'),
  credits: z.coerce.number().min(1).max(12),
  department: z.string().min(1).optional(),
  prerequisites: z.array(z.string()).optional(),
  description: z.string().optional(),
  semesters: z.array(z.enum(['spring', 'summer', 'fall', 'winter'])),
  category: z.enum(['major_required', 'major_compulsory', 'major_elective', 'general_required', 'general_elective', 'free_elective', 'teaching']).optional(),
  recommendedYear: z.coerce.number().min(1).max(6).optional(),
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

    let course;
    if (validatedData.official) {
      if (!(await isActiveAdminSession(session))) {
        return NextResponse.json({ success: false, error: '관리자 권한이 필요합니다.' }, { status: 403 });
      }
      const official = createCourseSchema.extend({
        department: z.string().regex(/^[a-f\d]{24}$/i, '학과를 선택해주세요.'),
        curriculumYear: z.number().int().min(2020).max(2100),
        category: createCourseSchema.shape.category.unwrap(),
        recommendedYear: z.number().int().min(1).max(6),
        recommendedSemester: z.enum(['spring', 'fall']),
        semesters: z.array(z.enum(['spring', 'summer', 'fall', 'winter'])).min(1),
      }).parse(validatedData);
      course = await courseService.createOfficial(official);
    } else {
      course = await courseService.create({ ...validatedData, createdBy: session.user.id });
    }

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
