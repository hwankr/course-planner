/**
 * @api-separable
 * @endpoint GET /api/plans/:id - 계획 상세 조회
 * @endpoint DELETE /api/plans/:id - 계획 초기화 (모든 학기/과목 삭제)
 * @service planService.findById, planService.resetPlan
 * @migration-notes Express 변환 시: app.get('/api/plans/:id', ...), app.delete('/api/plans/:id', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { planService } from '@/services';
import { isValidObjectId, invalidIdResponse } from '@/lib/validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
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
    const plan = await planService.findById(id);

    if (!plan) {
      return NextResponse.json(
        { success: false, error: '계획을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 본인 계획인지 확인
    if (plan.user.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error('GET /api/plans/[id] error:', error);
    return NextResponse.json(
      { success: false, error: '계획을 불러오는데 실패했습니다.' },
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

    const { id } = await params;
    if (!isValidObjectId(id)) return invalidIdResponse('계획 ID');
    const plan = await planService.findById(id);

    if (!plan) {
      return NextResponse.json(
        { success: false, error: '계획을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (plan.user.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const resetted = await planService.resetPlan(id);

    return NextResponse.json({
      success: true,
      data: resetted,
      message: '계획이 초기화되었습니다.',
    });
  } catch (error) {
    console.error('DELETE /api/plans/[id] error:', error);
    return NextResponse.json(
      { success: false, error: '계획 초기화에 실패했습니다.' },
      { status: 500 }
    );
  }
}
