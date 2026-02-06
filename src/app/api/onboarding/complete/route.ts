/**
 * @api-separable
 * @endpoint POST /api/onboarding/complete
 * @service onboardingService.completeOnboarding
 * @migration-notes Express 변환 시: app.post('/api/onboarding/complete', ...)
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { onboardingService } from '@/services/onboarding.service';
import { z } from 'zod';

const completeOnboardingSchema = z.object({
  departmentId: z.string().min(1, '학과를 선택해주세요.'),
  enrollmentYear: z.number().int().min(2000).max(2100),
  graduationRequirements: z.object({
    totalCredits: z.number().int().min(1),
    majorCredits: z.number().int().min(0),
    majorRequiredMin: z.number().int().min(0),
    generalCredits: z.number().int().min(0),
    earnedTotalCredits: z.number().int().min(0),
    earnedMajorCredits: z.number().int().min(0),
    earnedGeneralCredits: z.number().int().min(0),
    earnedMajorRequiredCredits: z.number().int().min(0),
  }),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = completeOnboardingSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { success: false, error: parsed.error.issues[0]?.message || '입력값이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    const result = await onboardingService.completeOnboarding(
      session.user.id,
      parsed.data
    );

    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('Onboarding complete error:', error);
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : '온보딩 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
