/**
 * @api-separable
 * @endpoint GET /api/plans - 내 계획 목록 조회
 * @endpoint POST /api/plans - 새 계획 생성
 * @service planService.findByUser, planService.create
 * @migration-notes Express 변환 시: app.get('/api/plans', ...), app.post('/api/plans', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { planService } from '@/services';
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

    const plans = await planService.findByUser(session.user.id);

    return NextResponse.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error('GET /api/plans error:', error);
    return NextResponse.json(
      { success: false, error: '계획 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

const createPlanSchema = z.object({
  name: z.string().min(1, '계획 이름은 필수입니다.'),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createPlanSchema.parse(body);

    const plan = await planService.create(session.user.id, validatedData);

    return NextResponse.json({
      success: true,
      data: plan,
      message: '계획이 생성되었습니다.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: '계획 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
