/**
 * @api-separable
 * @endpoint PATCH /api/feedback/:id - 피드백 상태 업데이트 (관리자)
 * @service feedbackService.updateStatus
 * @migration-notes Express 변환 시: app.patch('/api/feedback/:id', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { feedbackService } from '@/services';
import { z } from 'zod';
import { isValidObjectId, invalidIdResponse } from '@/lib/validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'resolved'], {
    message: '유효한 상태를 선택해주세요.',
  }),
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
    const validatedData = updateStatusSchema.parse(body);

    const feedback = await feedbackService.updateStatus(id, validatedData.status);

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

    console.error('PATCH /api/feedback/[id] error:', error);
    return NextResponse.json(
      { success: false, error: '피드백 상태 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}
