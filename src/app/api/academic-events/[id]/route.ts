/**
 * @api-separable
 * @endpoint PUT /api/academic-events/:id - 학사 일정 수정 (관리자)
 * @endpoint DELETE /api/academic-events/:id - 학사 일정 삭제 (관리자)
 * @service academicEventService.update, academicEventService.remove
 * @migration-notes Express 변환 시: app.put('/api/academic-events/:id', ...), app.delete('/api/academic-events/:id', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { academicEventService } from '@/services';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';

const updateEventSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  category: z.enum(['academic', 'registration', 'exam', 'holiday', 'other']).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  isHoliday: z.boolean().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateEventSchema.parse(body);

    const event = await academicEventService.update(id, validatedData as Record<string, unknown>);

    if (!event) {
      return NextResponse.json(
        { success: false, error: '해당 일정을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: event,
      message: '학사 일정이 수정되었습니다.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '학사 일정 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const event = await academicEventService.remove(id);

    if (!event) {
      return NextResponse.json(
        { success: false, error: '해당 일정을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '학사 일정이 삭제되었습니다.',
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '학사 일정 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
