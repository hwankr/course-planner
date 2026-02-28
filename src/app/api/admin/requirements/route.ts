/**
 * @api-separable
 * @endpoint GET /api/admin/requirements - 졸업요건 목록 (관리자)
 * @endpoint POST /api/admin/requirements - 졸업요건 생성 (관리자)
 * @service departmentRequirementService.findAll, departmentRequirementService.create
 * @migration-notes Express 변환 시: app.get/post('/api/admin/requirements', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { departmentRequirementService } from '@/services';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';

const requirementSchema = z.object({
  college: z.string().min(1, '대학명은 필수입니다.'),
  departmentName: z.string().min(1, '학과명은 필수입니다.'),
  year: z.number().int().min(2020).max(2030).default(2025),
  generalCredits: z.number().nullable(),
  single: z.object({
    majorRequiredMin: z.number().nullable(),
    majorCredits: z.number().nullable(),
  }),
  double: z.object({
    majorRequiredMin: z.number().nullable(),
    majorCredits: z.number().nullable(),
  }),
  minor: z.object({
    majorRequiredMin: z.number().nullable(),
    majorCredits: z.number().nullable(),
    primaryMajorMin: z.number().nullable(),
  }),
  totalCredits: z.number().min(1, '졸업학점은 필수입니다.'),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const college = searchParams.get('college') || undefined;

    const requirements = await departmentRequirementService.findAll({ college });
    return NextResponse.json({ success: true, data: requirements });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '졸업요건 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = requirementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const requirement = await departmentRequirementService.create(parsed.data);
    return NextResponse.json({ success: true, data: requirement }, { status: 201 });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '졸업요건 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
