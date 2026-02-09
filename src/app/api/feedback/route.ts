/**
 * @api-separable
 * @endpoint POST /api/feedback - 피드백 제출
 * @service feedbackService.create
 * @migration-notes Express 변환 시: app.post('/api/feedback', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { feedbackService } from '@/services/feedback.service';
import { createRateLimiter, getClientIp, rateLimitResponse } from '@/lib/rateLimit';
import { z } from 'zod';

// Feedback-specific rate limiter: 5 submissions per 15 minutes
const feedbackLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // 5회
});

const feedbackSchema = z.object({
  category: z.enum(['bug', 'feature', 'data-error', 'other'], {
    message: '유효한 카테고리를 선택해주세요.',
  }),
  content: z
    .string()
    .min(10, '피드백 내용은 최소 10자 이상 입력해주세요.')
    .max(2000, '피드백 내용은 2000자를 초과할 수 없습니다.'),
  email: z.string().email('유효한 이메일 주소를 입력해주세요.').optional().or(z.literal('')),
});

export async function POST(request: Request) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request);
    const rateLimitResult = feedbackLimiter.check(clientIp);

    if (!rateLimitResult.success) {
      return rateLimitResponse();
    }

    // Validate request body
    const body = await request.json();
    const validatedData = feedbackSchema.parse(body);

    // Get user session (optional - anonymous feedback allowed)
    const session = await getServerSession(authOptions);

    // Prepare feedback data
    const feedbackData = {
      category: validatedData.category,
      message: validatedData.content,
      email: validatedData.email || undefined,
      userId: session?.user?.id,
    };

    // Create feedback
    await feedbackService.create(feedbackData);

    return NextResponse.json(
      {
        success: true,
        message: '피드백이 성공적으로 제출되었습니다. 소중한 의견 감사합니다!',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error('POST /api/feedback error:', error);
    return NextResponse.json(
      { success: false, error: '피드백 제출에 실패했습니다.' },
      { status: 500 }
    );
  }
}
