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
import * as Sentry from '@sentry/nextjs';

const registerSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요.'),
  password: z.string()
    .min(8, '비밀번호는 8자 이상이어야 합니다.')
    .regex(/[A-Z]/, '비밀번호에 대문자를 포함해야 합니다.')
    .regex(/[a-z]/, '비밀번호에 소문자를 포함해야 합니다.')
    .regex(/[0-9]/, '비밀번호에 숫자를 포함해야 합니다.'),
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

    // Body size limit check (defense-in-depth)
    const contentLength = parseInt(request.headers.get('content-length') || '0');
    if (contentLength > 100 * 1024) { // 100KB limit for this endpoint
      return NextResponse.json(
        { success: false, error: '요청 데이터가 너무 큽니다.' },
        { status: 413 }
      );
    }

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

    if (error instanceof Error && error.message === '이미 등록된 이메일입니다.') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '회원가입에 실패했습니다.' },
      { status: 500 }
    );
  }
}
