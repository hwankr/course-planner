/**
 * @api-separable
 * @endpoint POST /api/patch-notes/:id/read - 업데이트 소식 읽음 처리
 * @service patchNoteService.markAsRead
 * @migration-notes Express 변환 시: app.post('/api/patch-notes/:id/read', ...)
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

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!isValidObjectId(id)) return invalidIdResponse('업데이트 소식 ID');

    await patchNoteService.markAsRead(session.user.id, id);

    return NextResponse.json({ success: true, message: '읽음 처리되었습니다.' });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '읽음 처리에 실패했습니다.' },
      { status: 500 }
    );
  }
}
