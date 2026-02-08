/**
 * @api-separable
 * @endpoint GET /api/statistics/anonymous-plans/:anonymousId
 * @service statisticsService.getAnonymousPlanDetail
 * @access public (with departmentId param) | authenticated
 * @migration-notes Express 변환 시: 인증 미들웨어를 optional로 설정, departmentId query param으로 게스트 접근 허용
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { statisticsService } from '@/services';

interface RouteParams {
  params: Promise<{ anonymousId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);

    // Allow guest access with departmentId query param
    const departmentId = searchParams.get('departmentId') || session?.user?.department;

    if (!departmentId) {
      return NextResponse.json(
        {
          success: false,
          error: '학과를 설정해주세요.',
          code: 'DEPARTMENT_NOT_SET',
          redirectTo: '/profile',
        },
        { status: 400 }
      );
    }

    const { anonymousId } = await params;
    const detail = await statisticsService.getAnonymousPlanDetail(
      anonymousId,
      departmentId
    );

    if (!detail) {
      return NextResponse.json(
        { success: false, error: '해당 계획을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: detail });
  } catch (error) {
    console.error('GET /api/statistics/anonymous-plans/[anonymousId] error:', error);
    return NextResponse.json(
      { success: false, error: '계획을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
