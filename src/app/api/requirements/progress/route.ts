/**
 * @api-separable
 * @endpoint GET /api/requirements/progress - 졸업요건 충족 현황 조회
 * @service requirementService.calculateProgress
 * @migration-notes Express 변환 시: app.get('/api/requirements/progress', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requirementService } from '@/services';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');

    if (!departmentId) {
      return NextResponse.json(
        { success: false, error: '학과 ID는 필수입니다.' },
        { status: 400 }
      );
    }

    const progress = await requirementService.calculateProgress(
      session.user.id,
      departmentId
    );

    return NextResponse.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '졸업요건 현황을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
