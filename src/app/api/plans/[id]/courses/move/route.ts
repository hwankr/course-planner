/**
 * @api-separable
 * @endpoint POST /api/plans/:id/courses/move - 과목을 학기 간 이동
 * @service planService.moveCourse
 * @migration-notes Express 변환 시: app.post('/api/plans/:id/courses/move', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { planService } from '@/services';
import { isValidObjectId, invalidIdResponse } from '@/lib/validation';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const moveCourseSchema = z.object({
  sourceYear: z.number().min(1).max(6),
  sourceTerm: z.enum(['spring', 'fall']),
  destYear: z.number().min(1).max(6),
  destTerm: z.enum(['spring', 'fall']),
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
    if (!isValidObjectId(planId)) return invalidIdResponse('계획 ID');

    const body = await request.json();
    const { sourceYear, sourceTerm, destYear, destTerm, courseId } = moveCourseSchema.parse(body);

    if (!isValidObjectId(courseId)) return invalidIdResponse('과목 ID');

    // 본인 계획인지 확인
    const existingPlan = await planService.findById(planId);
    if (!existingPlan || existingPlan.user.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const plan = await planService.moveCourse(
      planId,
      sourceYear,
      sourceTerm,
      destYear,
      destTerm,
      courseId
    );

    return NextResponse.json({
      success: true,
      data: plan,
      message: '과목이 이동되었습니다.',
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
      { success: false, error: '과목 이동에 실패했습니다.' },
      { status: 500 }
    );
  }
}
