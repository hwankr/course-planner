/**
 * @api-separable
 * @endpoint GET /api/notifications - 알림 목록 조회
 * @service notificationService.getNotifications
 * @migration-notes Express 변환 시: app.get('/api/notifications', ...)
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

    const notifications = await notificationService.getNotifications(
      session.user.id,
      session.user.role || 'student'
    );

    return NextResponse.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '알림 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
