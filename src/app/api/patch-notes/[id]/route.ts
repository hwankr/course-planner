/**
 * @api-separable
 * @endpoint GET /api/patch-notes/:id - 업데이트 소식 상세 조회
 * @endpoint PATCH /api/patch-notes/:id - 업데이트 소식 수정
 * @endpoint DELETE /api/patch-notes/:id - 업데이트 소식 삭제
 * @service patchNoteService.findById, patchNoteService.update, patchNoteService.deleteById
 * @migration-notes Express 변환 시: app.get('/api/patch-notes/:id', ...) + app.patch(...) + app.delete(...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { patchNoteService } from '@/services/patchNote.service';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';
import { isValidObjectId, invalidIdResponse } from '@/lib/validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(5000).optional(),
  version: z.string().max(50).optional(),
  status: z.enum(['draft', 'published']).optional(),
});

export async function GET(request: Request, { params }: RouteParams) {
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

    const patchNote = await patchNoteService.findById(id);
    if (!patchNote) {
      return NextResponse.json(
        { success: false, error: '업데이트 소식을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 일반 사용자는 발행된 업데이트 소식만 조회 가능
    if (patchNote.status === 'draft' && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '업데이트 소식을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: patchNote });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '업데이트 소식을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
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

    const body = await request.json();
    const validated = updateSchema.parse(body);

    const patchNote = await patchNoteService.update(id, validated);
    if (!patchNote) {
      return NextResponse.json(
        { success: false, error: '업데이트 소식을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: patchNote });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '업데이트 소식 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
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

    const deleted = await patchNoteService.deleteById(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: '업데이트 소식을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: '업데이트 소식이 삭제되었습니다.' });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '업데이트 소식 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
