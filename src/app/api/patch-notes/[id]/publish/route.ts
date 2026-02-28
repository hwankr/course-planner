/**
 * @api-separable
 * @endpoint PATCH /api/patch-notes/:id/publish - 업데이트 소식 발행
 * @service patchNoteService.publish
 * @migration-notes Express 변환 시: app.patch('/api/patch-notes/:id/publish', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { patchNoteService } from '@/services/patchNote.service';
import * as Sentry from '@sentry/nextjs';
import { isValidObjectId, invalidIdResponse } from '@/lib/validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!isValidObjectId(id)) return invalidIdResponse('업데이트 소식 ID');

    const patchNote = await patchNoteService.publish(id);
    if (!patchNote) {
      return NextResponse.json(
        { success: false, error: '업데이트 소식을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: patchNote });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '업데이트 소식 발행에 실패했습니다.' },
      { status: 500 }
    );
  }
}
