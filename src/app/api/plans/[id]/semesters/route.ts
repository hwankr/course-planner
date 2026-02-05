/**
 * @api-separable
 * @endpoint POST /api/plans/:id/semesters - 빈 학기 추가
 * @endpoint DELETE /api/plans/:id/semesters - 학기 제거
 * @service planService.addSemester, planService.removeSemester
 * @migration-notes Express 변환 시: app.post('/api/plans/:id/semesters', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { planService } from '@/services';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const semesterSchema = z.object({
  year: z.number(),
  term: z.enum(['spring', 'fall']),
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
    const { year, term } = semesterSchema.parse(body);

    // 본인 계획인지 확인
    const existingPlan = await planService.findById(planId);
    if (!existingPlan || existingPlan.user.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 학기 추가
    await planService.addSemester(planId, year, term);

    // CRITICAL: addSemester does NOT populate, so fetch again
    const plan = await planService.findById(planId);

    return NextResponse.json({
      success: true,
      data: plan,
      message: '학기가 추가되었습니다.',
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
      { success: false, error: '학기 추가에 실패했습니다.' },
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
    const body = await request.json();
    const { year, term } = semesterSchema.parse(body);

    const existingPlan = await planService.findById(planId);
    if (!existingPlan || existingPlan.user.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const plan = await planService.removeSemester(planId, year, term);

    return NextResponse.json({
      success: true,
      data: plan,
      message: '학기가 제거되었습니다.',
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
      { success: false, error: '학기 제거에 실패했습니다.' },
      { status: 500 }
    );
  }
}
