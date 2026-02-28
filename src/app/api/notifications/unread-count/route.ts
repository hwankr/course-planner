/**
 * @api-separable
 * @endpoint GET /api/notifications/unread-count - 통합 미읽음 알림 수 조회 (피드백 + 업데이트 소식)
 * @service notificationService.getUnreadCount
 * @migration-notes Express 변환 시: app.get('/api/notifications/unread-count', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { notificationService } from '@/services/notification.service';
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

    const count = await notificationService.getUnreadCount(
      session.user.id,
      session.user.role || 'student'
    );

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
