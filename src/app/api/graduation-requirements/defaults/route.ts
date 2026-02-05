/**
 * @api-separable
 * @endpoint POST /api/graduation-requirements/defaults - 기본 졸업요건 생성
 * @service graduationRequirementService.createDefaults
 * @migration-notes Express 변환 시: app.post('/api/graduation-requirements/defaults', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { graduationRequirementService } from '@/services';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // Check if user already has a graduation requirement
    const existing = await graduationRequirementService.findByUser(session.user.id);
    if (existing) {
      return NextResponse.json(
        { success: false, error: '이미 졸업요건이 설정되어 있습니다.' },
        { status: 400 }
      );
    }

    const requirement = await graduationRequirementService.createDefaults(session.user.id);

    return NextResponse.json({
      success: true,
      data: requirement,
      message: '기본 졸업요건이 생성되었습니다.',
    });
  } catch (error) {
    console.error('POST /api/graduation-requirements/defaults error:', error);
    return NextResponse.json(
      { success: false, error: '기본 졸업요건 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
