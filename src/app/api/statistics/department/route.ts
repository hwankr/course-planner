/**
 * @api-separable
 * @endpoint GET /api/statistics/department
 * @service statisticsService.getDepartmentCourseStats
 * @migration-notes Express 변환 시: app.get('/api/statistics/department', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { statisticsService } from '@/services';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // Determine department
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId') || session.user.department;

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
      session.user.id
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
    console.error('GET /api/statistics/department error:', error);
    return NextResponse.json(
      { success: false, error: '통계를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
