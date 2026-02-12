/**
 * @api-separable
 * @endpoint PATCH /api/admin/users/:id - 사용자 역할 변경 (관리자)
 * @endpoint DELETE /api/admin/users/:id - 사용자 삭제 (관리자)
 * @service userService.updateRole, userService.adminDeleteUser
 * @migration-notes Express 변환 시: app.patch('/api/admin/users/:id', ...), app.delete('/api/admin/users/:id', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { userService } from '@/services/user.service';
import { isValidObjectId, invalidIdResponse } from '@/lib/validation';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';

const updateRoleSchema = z.object({
  role: z.enum(['student', 'admin']),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

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

    if (!isValidObjectId(id)) {
      return invalidIdResponse('사용자 ID');
    }

    const body = await request.json();
    const parsed = updateRoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 역할입니다.' },
        { status: 400 }
      );
    }

    const user = await userService.updateRole(id, parsed.data.role);
    if (!user) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '역할 변경에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
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

    await userService.adminDeleteUser(id, session.user.id);

    return NextResponse.json({ success: true, message: '사용자가 삭제되었습니다.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : '사용자 삭제에 실패했습니다.';
    const isClientError = message.includes('자신의 계정') || message.includes('마지막 관리자') || message.includes('찾을 수 없습니다');

    if (!isClientError) {
      Sentry.captureException(error);
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: isClientError ? 400 : 500 }
    );
  }
}
