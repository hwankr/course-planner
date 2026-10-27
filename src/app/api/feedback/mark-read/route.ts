/**
 * @api-separable
 * @endpoint POST /api/feedback/mark-read
 * @service feedbackService.markAsReadByAdmin
 * @migration-notes Express: authenticated admin POST handler.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { authOptions } from '@/lib/auth/options';
import { isActiveAdminSession } from '@/lib/auth/admin-session';
import { feedbackService } from '@/services/feedback.service';

const schema = z.union([
  z.object({ ids: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(200) }),
  z.object({ all: z.literal(true) }),
]);
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(await isActiveAdminSession(session))) {
      return NextResponse.json({ success: false, error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }
    const body = schema.parse(await request.json());
    await feedbackService.markAsReadByAdmin('ids' in body ? body.ids : undefined);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ success: false, error: '읽음 처리할 항목을 확인해주세요.' }, { status: 400 });
    Sentry.captureException(error);
    return NextResponse.json({ success: false, error: '읽음 처리에 실패했습니다.' }, { status: 500 });
  }
}
