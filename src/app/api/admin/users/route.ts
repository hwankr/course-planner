/**
 * @api-separable
 * @endpoint GET /api/admin/users - 전체 사용자 목록 (관리자)
 * @service userService.findAllUsers
 * @migration-notes Express 변환 시: app.get('/api/admin/users', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { isActiveAdminSession } from '@/lib/auth/admin-session';
import { userService } from '@/services/user.service';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(await isActiveAdminSession(session))) {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const role = searchParams.get('role') || undefined;
    const department = searchParams.get('department') || undefined;
    const sort = searchParams.get('sort') || undefined;

    if (searchParams.has('page')) {
      const paging = z.object({ page: z.coerce.number().int().min(1), limit: z.coerce.number().int().min(1).max(200) })
        .safeParse({ page: searchParams.get('page'), limit: searchParams.get('limit') ?? 50 });
      if (!paging.success) return NextResponse.json({ success: false, error: '페이지와 개수를 확인해주세요.' }, { status: 400 });
      const result = await userService.findAllUsers({ search, role, department, sort, ...paging.data });
      return NextResponse.json({ success: true, ...result });
    }
    const users = await userService.findAllUsers({ search, role, department, sort });
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '사용자 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
