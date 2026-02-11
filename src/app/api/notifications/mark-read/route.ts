/**
 * @api-separable
 * @endpoint POST /api/notifications/mark-read - 모든 알림 읽음 처리
 * @service notificationService.markAllAsRead
 * @migration-notes Express 변환 시: app.post('/api/notifications/mark-read', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { notificationService } from '@/services/notification.service';
import * as Sentry from '@sentry/nextjs';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    await notificationService.markAllAsRead(
      session.user.id,
      session.user.role || 'student'
    );

    return NextResponse.json({
      success: true,
      message: '모든 알림이 읽음 처리되었습니다.',
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '알림 읽음 처리에 실패했습니다.' },
      { status: 500 }
    );
  }
}
