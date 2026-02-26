/**
 * @api-separable
 * @endpoint GET /api/feedback/unread-count - 미읽음 피드백 수 조회
 * @service feedbackService.getUnreadCountForAdmin, feedbackService.getUnreadCountForUser
 * @migration-notes Express 변환 시: app.get('/api/feedback/unread-count', ...)
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

    const count = session.user.role === 'admin'
      ? await feedbackService.getUnreadCountForAdmin()
      : await feedbackService.getUnreadCountForUser(session.user.id);

    return NextResponse.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '알림 수를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
