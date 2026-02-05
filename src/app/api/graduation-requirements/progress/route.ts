/**
 * @api-separable
 * @endpoint GET /api/graduation-requirements/progress - 졸업요건 충족 현황 조회
 * @service graduationRequirementService.calculateProgress
 * @migration-notes Express 변환 시: app.get('/api/graduation-requirements/progress', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { graduationRequirementService } from '@/services';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const progress = await graduationRequirementService.calculateProgress(session.user.id);

    return NextResponse.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    console.error('GET /api/graduation-requirements/progress error:', error);
    return NextResponse.json(
      { success: false, error: '졸업요건 충족 현황을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
