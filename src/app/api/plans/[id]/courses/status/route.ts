/**
 * @api-separable
 * @endpoint PATCH /api/plans/:id/courses/status - 과목 상태 업데이트
 * @service planService.updateCourseStatus
 * @migration-notes Express 변환 시: app.patch('/api/plans/:id/courses/status', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { planService } from '@/services';
import { z } from 'zod';
import { isValidObjectId, invalidIdResponse } from '@/lib/validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateStatusSchema = z.object({
  year: z.number().min(1).max(6),
  term: z.enum(['spring', 'fall']),
  courseId: z.string().min(1),
  status: z.enum(['planned', 'enrolled', 'completed', 'failed']),
  grade: z.string().optional(),
});

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!isValidObjectId(id)) return invalidIdResponse('계획 ID');

    // Ownership check: fetch plan first
    const existingPlan = await planService.findById(id);
    if (!existingPlan) {
      return NextResponse.json(
        { success: false, error: '계획을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    if (existingPlan.user.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { year, term, courseId, status, grade } = updateStatusSchema.parse(body);
    if (!isValidObjectId(courseId)) return invalidIdResponse('과목 ID');

    const updatedPlan = await planService.updateCourseStatus(
      id, year, term, courseId, status, grade
    );

    if (!updatedPlan) {
      return NextResponse.json(
        { success: false, error: '과목 상태 업데이트에 실패했습니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedPlan,
      message: '과목 상태가 업데이트되었습니다.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error('PATCH /api/plans/[id]/courses/status error:', error);
    return NextResponse.json(
      { success: false, error: '과목 상태 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}
