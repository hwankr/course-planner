/**
 * @api-separable
 * @endpoint GET /api/admin/requirements/:id - 졸업요건 상세 (관리자)
 * @endpoint PUT /api/admin/requirements/:id - 졸업요건 수정 (관리자)
 * @endpoint DELETE /api/admin/requirements/:id - 졸업요건 삭제 (관리자)
 * @service departmentRequirementService.update, departmentRequirementService.remove
 * @migration-notes Express 변환 시: app.get/put/delete('/api/admin/requirements/:id', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { departmentRequirementService } from '@/services';
import { z } from 'zod';
import { isValidObjectId, invalidIdResponse } from '@/lib/validation';
import * as Sentry from '@sentry/nextjs';
import { connectDB } from '@/lib/db/mongoose';
import DepartmentRequirement from '@/models/DepartmentRequirement';

const requirementSchema = z.object({
  college: z.string().min(1, '대학명은 필수입니다.'),
  departmentName: z.string().min(1, '학과명은 필수입니다.'),
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

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!isValidObjectId(id)) return invalidIdResponse();

    await connectDB();
    const requirement = await DepartmentRequirement.findById(id).lean();
    if (!requirement) {
      return NextResponse.json(
        { success: false, error: '졸업요건을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: requirement });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '졸업요건을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(_request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!isValidObjectId(id)) return invalidIdResponse();

    const body = await _request.json();
    const parsed = requirementSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const updated = await departmentRequirementService.update(id, parsed.data);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: '졸업요건을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '졸업요건 수정에 실패했습니다.' },
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
    if (!isValidObjectId(id)) return invalidIdResponse();

    const deleted = await departmentRequirementService.remove(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: '졸업요건을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '졸업요건 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
