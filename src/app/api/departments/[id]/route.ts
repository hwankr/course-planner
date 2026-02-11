/**
 * @api-separable
 * @endpoint GET /api/departments/:id - 학과 상세 조회
 * @endpoint PUT /api/departments/:id - 학과 수정 (관리자)
 * @endpoint DELETE /api/departments/:id - 학과 삭제 (관리자)
 * @service departmentService.findById, departmentService.update, departmentService.remove
 * @migration-notes Express 변환 시: app.get('/api/departments/:id', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { departmentService } from '@/services';
import { z } from 'zod';
import { isValidObjectId, invalidIdResponse } from '@/lib/validation';
import * as Sentry from '@sentry/nextjs';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return invalidIdResponse('학과 ID');
    const department = await departmentService.findById(id);

    if (!department) {
      return NextResponse.json(
        { success: false, error: '학과를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: department,
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '학과를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

const updateDepartmentSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  college: z.string().optional(),
});

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!isValidObjectId(id)) return invalidIdResponse('학과 ID');
    const body = await request.json();
    const validatedData = updateDepartmentSchema.parse(body);

    const department = await departmentService.update(id, validatedData);

    if (!department) {
      return NextResponse.json(
        { success: false, error: '학과를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: department,
      message: '학과가 수정되었습니다.',
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
      { success: false, error: '학과 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!isValidObjectId(id)) return invalidIdResponse('학과 ID');
    const department = await departmentService.remove(id);

    if (!department) {
      return NextResponse.json(
        { success: false, error: '학과를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '학과가 삭제되었습니다.',
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '학과 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
