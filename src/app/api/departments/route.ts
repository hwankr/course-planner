/**
 * @api-separable
 * @endpoint GET /api/departments - 학과 목록 조회
 * @endpoint POST /api/departments - 학과 생성 (관리자)
 * @service departmentService.findAll, departmentService.create
 * @migration-notes Express 변환 시: app.get('/api/departments', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { departmentService } from '@/services';
import { z } from 'zod';

export async function GET() {
  try {
    const departments = await departmentService.findAll();

    return NextResponse.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    console.error('GET /api/departments error:', error);
    return NextResponse.json(
      { success: false, error: '학과 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

const createDepartmentSchema = z.object({
  code: z.string().min(1, '학과 코드는 필수입니다.'),
  name: z.string().min(1, '학과명은 필수입니다.'),
  college: z.string().optional(),
});

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
    const validatedData = createDepartmentSchema.parse(body);

    const department = await departmentService.create(validatedData);

    return NextResponse.json({
      success: true,
      data: department,
      message: '학과가 생성되었습니다.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: '학과 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
