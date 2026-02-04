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

interface RouteParams {
  params: Promise<{ id: string }>;
}

const addCourseSchema = z.object({
  year: z.number(),
  term: z.enum(['spring', 'fall']),
  courseId: z.string().min(1),
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
    const body = await request.json();
    const { year, term, courseId } = addCourseSchema.parse(body);

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

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: '과목 추가에 실패했습니다.' },
      { status: 500 }
    );
  }
}

const removeCourseSchema = z.object({
  year: z.number(),
  term: z.enum(['spring', 'fall']),
  courseId: z.string().min(1),
});

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
    const body = await request.json();
    const { year, term, courseId } = removeCourseSchema.parse(body);

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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: '과목 제거에 실패했습니다.' },
      { status: 500 }
    );
  }
}
