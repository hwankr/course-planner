/**
 * @api-separable
 * @endpoint POST /api/plans/:id/courses - 학기에 과목 추가
 * @endpoint DELETE /api/plans/:id/courses - 학기에서 과목 제거
 * @service planService.addCourseToSemester, planService.removeCourseFromSemester
 * @migration-notes Express 변환 시: app.post('/api/plans/:id/courses', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { planService } from '@/services';
import { z } from 'zod';
import { isValidObjectId, invalidIdResponse } from '@/lib/validation';
import * as Sentry from '@sentry/nextjs';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const addCourseSchema = z.object({
  year: z.number().min(1, '학년은 1 이상이어야 합니다.').max(6, '학년은 6 이하여야 합니다.'),
  term: z.enum(['spring', 'fall']),
  courseId: z.string().min(1),
  category: z.enum(['major_required', 'major_compulsory', 'major_elective', 'general_required', 'general_elective', 'free_elective', 'teaching']).optional(),
});

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id: planId } = await params;
    if (!isValidObjectId(planId)) return invalidIdResponse('계획 ID');

    const body = await request.json();
    const { year, term, courseId, category } = addCourseSchema.parse(body);
    if (!isValidObjectId(courseId)) return invalidIdResponse('과목 ID');

    // 본인 계획인지 확인
    const existingPlan = await planService.findById(planId);
    if (!existingPlan || existingPlan.user.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const plan = await planService.addCourseToSemester({
      planId,
      year,
      term,
      courseId,
      category,
    });

    return NextResponse.json({
      success: true,
      data: plan,
      message: '과목이 추가되었습니다.',
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
      { success: false, error: '과목 추가에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id: planId } = await params;
    if (!isValidObjectId(planId)) return invalidIdResponse('계획 ID');

    // Query params에서 읽기
    const { searchParams } = new URL(request.url);
    const yearStr = searchParams.get('year');
    const term = searchParams.get('term');
    const courseId = searchParams.get('courseId');

    if (!yearStr || !term || !courseId) {
      return NextResponse.json(
        { success: false, error: 'year, term, courseId 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }

    const year = parseInt(yearStr, 10);
    if (isNaN(year) || year < 1 || year > 6) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 학년입니다.' },
        { status: 400 }
      );
    }

    if (term !== 'spring' && term !== 'fall') {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 학기입니다.' },
        { status: 400 }
      );
    }

    if (!isValidObjectId(courseId)) return invalidIdResponse('과목 ID');

    const existingPlan = await planService.findById(planId);
    if (!existingPlan || existingPlan.user.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const plan = await planService.removeCourseFromSemester(
      planId,
      year,
      term,
      courseId
    );

    return NextResponse.json({
      success: true,
      data: plan,
      message: '과목이 제거되었습니다.',
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '과목 제거에 실패했습니다.' },
      { status: 500 }
    );
  }
}
