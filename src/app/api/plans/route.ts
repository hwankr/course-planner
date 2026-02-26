/**
 * @api-separable
 * @endpoint GET /api/plans - 내 계획 조회 (자동 생성)
 * @service planService.findOrCreateByUser
 * @migration-notes Express 변환 시: app.get('/api/plans', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { planService } from '@/services';
import * as Sentry from '@sentry/nextjs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const plan = await planService.findOrCreateByUser(session.user.id);

    return NextResponse.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '계획을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
