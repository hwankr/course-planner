/**
 * @api-separable
 * @endpoint GET /api/courses/:id - 과목 상세 조회
 * @endpoint PUT /api/courses/:id - 과목 수정 (관리자)
 * @endpoint DELETE /api/courses/:id - 과목 삭제 (관리자)
 * @service courseService.findById, courseService.update, courseService.remove
 * @migration-notes Express 변환 시: app.get('/api/courses/:id', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { courseService } from '@/services';
import { z } from 'zod';
import { isValidObjectId, invalidIdResponse } from '@/lib/validation';
import * as Sentry from '@sentry/nextjs';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return invalidIdResponse('과목 ID');
    const course = await courseService.findById(id);

    if (!course) {
      return NextResponse.json(
        { success: false, error: '과목을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: course,
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '과목을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

const updateCourseSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  credits: z.number().min(1).max(12).optional(),
  department: z.string().optional(),
  prerequisites: z.array(z.string()).optional(),
  description: z.string().optional(),
  semesters: z.array(z.enum(['spring', 'summer', 'fall', 'winter'])).optional(),
  category: z.enum(['major_required', 'major_compulsory', 'major_elective', 'general_required', 'general_elective', 'free_elective', 'teaching']).optional(),
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
    if (!isValidObjectId(id)) return invalidIdResponse('과목 ID');
    const body = await request.json();
    const validatedData = updateCourseSchema.parse(body);

    const course = await courseService.update(id, validatedData);

    if (!course) {
      return NextResponse.json(
        { success: false, error: '과목을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: course,
      message: '과목이 수정되었습니다.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: '과목 수정에 실패했습니다.' },
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
    if (!isValidObjectId(id)) return invalidIdResponse('과목 ID');
    const course = await courseService.remove(id);

    if (!course) {
      return NextResponse.json(
        { success: false, error: '과목을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '과목이 삭제되었습니다.',
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '과목 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
