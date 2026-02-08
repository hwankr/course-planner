/**
 * @api-separable
 * @endpoint GET /api/requirements - 졸업요건 조회
 * @endpoint POST /api/requirements - 졸업요건 생성 (관리자)
 * @service requirementService.findByDepartment, requirementService.create
 * @migration-notes Express 변환 시: app.get('/api/requirements', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requirementService } from '@/services';
import { z } from 'zod';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');

    if (!departmentId) {
      return NextResponse.json(
        { success: false, error: '학과 ID는 필수입니다.' },
        { status: 400 }
      );
    }

    const requirements = await requirementService.findByDepartment(departmentId);

    return NextResponse.json({
      success: true,
      data: requirements,
    });
  } catch (error) {
    console.error('GET /api/requirements error:', error);
    return NextResponse.json(
      { success: false, error: '졸업요건을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

const createRequirementSchema = z.object({
  department: z.string().min(1, '학과는 필수입니다.'),
  name: z.string().min(1, '요건 이름은 필수입니다.'),
  category: z.enum([
    'major_required',
    'major_compulsory',
    'major_elective',
    'general_required',
    'general_elective',
    'free_elective',
    'teaching',
  ]),
  requiredCredits: z.number().min(0),
  description: z.string().optional(),
  allowedCourses: z.array(z.string()).optional(),
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
    const validatedData = createRequirementSchema.parse(body);

    const requirement = await requirementService.create(validatedData);

    return NextResponse.json({
      success: true,
      data: requirement,
      message: '졸업요건이 생성되었습니다.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: '졸업요건 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
