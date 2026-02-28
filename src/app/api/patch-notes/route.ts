/**
 * @api-separable
 * @endpoint GET /api/patch-notes - 업데이트 소식 목록 조회
 * @endpoint POST /api/patch-notes - 업데이트 소식 생성
 * @service patchNoteService.findAll, patchNoteService.findPublished, patchNoteService.create
 * @migration-notes Express 변환 시: app.get('/api/patch-notes', ...) + app.post('/api/patch-notes', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { patchNoteService } from '@/services/patchNote.service';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';

const createSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  version: z.string().max(50).optional(),
  status: z.enum(['draft', 'published']).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    let patchNotes;
    if (session.user.role === 'admin') {
      const status = searchParams.get('status') as 'draft' | 'published' | undefined ?? undefined;
      patchNotes = await patchNoteService.findAll(status ? { status } : undefined);
    } else {
      patchNotes = await patchNoteService.findPublished();
    }

    return NextResponse.json({ success: true, data: patchNotes });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '업데이트 소식 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const validated = createSchema.parse(body);

    const patchNote = await patchNoteService.create(validated, session.user.id);

    return NextResponse.json({ success: true, data: patchNote }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '업데이트 소식 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
