/**
 * @api-separable
 * @endpoint GET /api/feedback/my - 사용자 본인 문의 목록 조회
 * @service feedbackService.findByUserIdAndMarkRead
 * @migration-notes Express 변환 시: app.get('/api/feedback/my', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { feedbackService } from '@/services/feedback.service';
import * as Sentry from '@sentry/nextjs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const feedbacks = await feedbackService.findByUserIdAndMarkRead(session.user.id);

    return NextResponse.json({
      success: true,
      data: feedbacks,
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '문의 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
