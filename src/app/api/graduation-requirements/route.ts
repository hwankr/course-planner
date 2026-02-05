/**
 * @api-separable
 * @endpoint GET /api/graduation-requirements - 졸업요건 조회
 * @endpoint PUT /api/graduation-requirements - 졸업요건 생성/수정 (upsert)
 * @service graduationRequirementService.findByUser, graduationRequirementService.upsert
 * @migration-notes Express 변환 시: app.get('/api/graduation-requirements', ...), app.put('/api/graduation-requirements', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { graduationRequirementService } from '@/services';
import { z } from 'zod';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const requirement = await graduationRequirementService.findByUser(session.user.id);

    return NextResponse.json({
      success: true,
      data: requirement,
    });
  } catch (error) {
    console.error('GET /api/graduation-requirements error:', error);
    return NextResponse.json(
      { success: false, error: '졸업요건을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

const upsertSchema = z.object({
  totalCredits: z.number().min(1, '졸업학점은 1 이상이어야 합니다.'),
  majorCredits: z.number().min(0, '전공학점은 0 이상이어야 합니다.'),
  majorRequiredMin: z.number().min(0, '전공핵심 최소학점은 0 이상이어야 합니다.'),
  generalCredits: z.number().min(0, '교양학점은 0 이상이어야 합니다.'),
  earnedMajorCredits: z.number().min(0, '기이수 전공학점은 0 이상이어야 합니다.'),
  earnedGeneralCredits: z.number().min(0, '기이수 교양학점은 0 이상이어야 합니다.'),
});

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = upsertSchema.parse(body);

    const requirement = await graduationRequirementService.upsert(session.user.id, validatedData);

    return NextResponse.json({
      success: true,
      data: requirement,
      message: '졸업요건이 저장되었습니다.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error('PUT /api/graduation-requirements error:', error);
    return NextResponse.json(
      { success: false, error: '졸업요건 저장에 실패했습니다.' },
      { status: 500 }
    );
  }
}
