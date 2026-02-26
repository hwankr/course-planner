/**
 * @api-separable
 * @endpoint PATCH /api/feedback/:id - 피드백 상태 업데이트 또는 관리자 답변 (관리자)
 * @service feedbackService.updateStatus, feedbackService.addAdminReply
 * @migration-notes Express 변환 시: app.patch('/api/feedback/:id', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { feedbackService } from '@/services';
import { z } from 'zod';
import { isValidObjectId, invalidIdResponse } from '@/lib/validation';
import * as Sentry from '@sentry/nextjs';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateSchema = z.object({
  status: z.enum(['pending', 'resolved']).optional(),
  adminReply: z.string().min(1, '답변 내용을 입력해주세요.').max(2000, '답변은 2000자를 초과할 수 없습니다.').optional(),
}).refine(data => data.status || data.adminReply, {
  message: '상태 또는 답변 내용을 입력해주세요.',
});

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!isValidObjectId(id)) return invalidIdResponse('피드백 ID');

    const body = await request.json();
    const validatedData = updateSchema.parse(body);

    let feedback;
    if (validatedData.adminReply) {
      feedback = await feedbackService.addAdminReply(id, validatedData.adminReply);
    } else if (validatedData.status) {
      feedback = await feedbackService.updateStatus(id, validatedData.status);
    }

    if (!feedback) {
      return NextResponse.json(
        { success: false, error: '피드백을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: feedback,
      message: '피드백 상태가 업데이트되었습니다.',
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
      { success: false, error: '피드백 상태 업데이트에 실패했습니다.' },
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

    const { id } = await params;
    if (!isValidObjectId(id)) return invalidIdResponse('피드백 ID');

    let deleted: boolean;
    if (session.user.role === 'admin') {
      deleted = await feedbackService.deleteById(id);
    } else {
      deleted = await feedbackService.deleteByUser(id, session.user.id);
    }

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: '피드백을 찾을 수 없거나 삭제 권한이 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '피드백이 삭제되었습니다.',
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '피드백 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
