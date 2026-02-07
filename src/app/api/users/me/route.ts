/**
 * @api-separable
 * @endpoint GET /api/users/me - 현재 사용자 정보 조회
 * @endpoint PATCH /api/users/me - 사용자 정보 업데이트
 * @endpoint DELETE /api/users/me - 회원 탈퇴 (계정 및 관련 데이터 삭제)
 * @service userService.findById, userService.update, userService.deleteWithCascade
 * @migration-notes Express 변환 시: app.get('/api/users/me', ...), app.patch('/api/users/me', ...), app.delete('/api/users/me', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { userService } from '@/services';
import { z } from 'zod';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const user = await userService.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        department: user.department,
        enrollmentYear: user.enrollmentYear,
        role: user.role,
        image: user.image,
        majorType: user.majorType,
        secondaryDepartment: user.secondaryDepartment,
      },
    });
  } catch (error) {
    console.error('GET /api/users/me error:', error);
    return NextResponse.json(
      { success: false, error: '사용자 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  department: z.string().min(1).optional(),
  enrollmentYear: z.number().min(2000).max(2030).optional(),
  majorType: z.enum(['single', 'double', 'minor']).optional(),
  secondaryDepartment: z.string().min(1).optional().nullable(),
});

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // Transform null to undefined for service layer
    const serviceData = {
      ...validatedData,
      secondaryDepartment: validatedData.secondaryDepartment === null ? undefined : validatedData.secondaryDepartment,
    };

    const updatedUser = await userService.update(session.user.id, serviceData);
    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser._id.toString(),
        email: updatedUser.email,
        name: updatedUser.name,
        department: updatedUser.department,
        enrollmentYear: updatedUser.enrollmentYear,
        role: updatedUser.role,
        image: updatedUser.image,
        majorType: updatedUser.majorType,
        secondaryDepartment: updatedUser.secondaryDepartment,
      },
      message: '프로필이 업데이트되었습니다.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error('PATCH /api/users/me error:', error);
    return NextResponse.json(
      { success: false, error: '프로필 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    await userService.deleteWithCascade(session.user.id);

    return NextResponse.json({
      success: true,
      message: '계정이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('DELETE /api/users/me error:', error);
    return NextResponse.json(
      { success: false, error: '계정 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
