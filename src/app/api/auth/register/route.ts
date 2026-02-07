/**
 * @api-separable
 * @endpoint POST /api/auth/register
 * @service userService.create
 * @migration-notes Express 변환 시: app.post('/api/auth/register', ...)
 */

import { NextResponse } from 'next/server';
import { userService } from '@/services';
import { z } from 'zod';
import { authLimiter, getClientIp, rateLimitResponse } from '@/lib/rateLimit';

const registerSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요.'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다.'),
  name: z.string().min(2, '이름은 2자 이상이어야 합니다.'),
  department: z.string().optional(),
  enrollmentYear: z.number().optional(),
});

export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateCheck = authLimiter.check(ip);
    if (!rateCheck.success) return rateLimitResponse();

    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    const user = await userService.create({
      ...validatedData,
      provider: 'credentials',
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      message: '회원가입이 완료되었습니다.',
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
      { success: false, error: '회원가입에 실패했습니다.' },
      { status: 500 }
    );
  }
}
