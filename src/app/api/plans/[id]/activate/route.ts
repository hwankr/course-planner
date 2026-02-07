/**
 * @api-separable
 * @endpoint PATCH /api/plans/:id/activate - 계획 활성화
 * @service planService.activate
 * @migration-notes Express 변환 시: app.patch('/api/plans/:id/activate', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { planService } from '@/services';
import { isValidObjectId, invalidIdResponse } from '@/lib/validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

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

    const activatedPlan = await planService.activate(id, session.user.id);

    if (!activatedPlan) {
      return NextResponse.json(
        { success: false, error: '계획 활성화에 실패했습니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: activatedPlan,
      message: '계획이 활성화되었습니다.',
    });
  } catch (error) {
    console.error('PATCH /api/plans/[id]/activate error:', error);
    return NextResponse.json(
      { success: false, error: '계획 활성화에 실패했습니다.' },
      { status: 500 }
    );
  }
}
