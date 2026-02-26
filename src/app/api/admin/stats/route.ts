/**
 * @api-separable
 * @endpoint GET /api/admin/stats - 관리자 통계 조회
 * @service adminService.getStats
 * @migration-notes Express 변환 시: app.get('/api/admin/stats', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { adminService } from '@/services/admin.service';
import * as Sentry from '@sentry/nextjs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const stats = await adminService.getStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '통계를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
