/**
 * @api-separable
 * @endpoint GET /api/statistics/anonymous-plans
 * @service statisticsService.getAnonymousPlans
 * @access public (with departmentId param) | authenticated
 * @migration-notes Express 변환 시: 인증 미들웨어를 optional로 설정, departmentId query param으로 게스트 접근 허용
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { statisticsService } from '@/services';

export async function GET(request: Request) {
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

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));

    const result = await statisticsService.getAnonymousPlans(
      departmentId,
      session?.user?.id || 'guest',
      page,
      limit
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('GET /api/statistics/anonymous-plans error:', error);
    return NextResponse.json(
      { success: false, error: '익명 계획을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
