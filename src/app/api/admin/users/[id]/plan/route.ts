/**
 * @api-separable
 * @endpoint GET /api/admin/users/:id/plan - 사용자 수강계획 조회 (관리자)
 * @service planService.findByUser
 * @migration-notes Express 변환 시: app.get('/api/admin/users/:id/plan', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { planService } from '@/services/plan.service';
import { isValidObjectId, invalidIdResponse } from '@/lib/validation';
import * as Sentry from '@sentry/nextjs';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return invalidIdResponse('사용자 ID');
    }

    const plan = await planService.findByUser(id);

    return NextResponse.json({ success: true, data: plan });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '수강계획을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
