/**
 * @api-separable
 * @endpoint GET /api/statistics/department
 * @service statisticsService.getDepartmentCourseStats
 * @access public (with departmentId param) | authenticated
 * @migration-notes Express 변환 시: 인증 미들웨어를 optional로 설정, departmentId query param으로 게스트 접근 허용
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { statisticsService } from '@/services';
import * as Sentry from '@sentry/nextjs';

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

    const stats = await statisticsService.getDepartmentCourseStats(
      departmentId,
      session?.user?.id
    );

    if (!stats) {
      return NextResponse.json({
        success: true,
        data: null,
        message: '아직 충분한 데이터가 없습니다.',
      });
    }

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '통계를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
