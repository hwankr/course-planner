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
import * as Sentry from '@sentry/nextjs';

const completeOnboardingSchema = z.object({
  departmentId: z.string().min(1, '학과를 선택해주세요.'),
  majorType: z.enum(['single', 'double', 'minor']).default('single'),
  secondaryDepartmentId: z.string().optional(),
  enrollmentYear: z.number().int().min(2000).max(2100),
  graduationRequirements: z.object({
    majorType: z.enum(['single', 'double', 'minor']),
    totalCredits: z.number().int().min(1),
    generalCredits: z.number().int().min(0),

    primaryMajorCredits: z.number().int().min(0),
    primaryMajorRequiredMin: z.number().int().min(0),

    secondaryMajorCredits: z.number().int().min(0).optional(),
    secondaryMajorRequiredMin: z.number().int().min(0).optional(),

    minorCredits: z.number().int().min(0).optional(),
    minorRequiredMin: z.number().int().min(0).optional(),
    minorPrimaryMajorMin: z.number().int().min(0).optional(),

    earnedTotalCredits: z.number().int().min(0),
    earnedGeneralCredits: z.number().int().min(0),
    earnedPrimaryMajorCredits: z.number().int().min(0),
    earnedPrimaryMajorRequiredCredits: z.number().int().min(0),
    earnedSecondaryMajorCredits: z.number().int().min(0).optional(),
    earnedSecondaryMajorRequiredCredits: z.number().int().min(0).optional(),
    earnedMinorCredits: z.number().int().min(0).optional(),
    earnedMinorRequiredCredits: z.number().int().min(0).optional(),
  }),
})
.refine(data => {
  if (data.majorType !== 'single' && !data.secondaryDepartmentId) {
    return false;
  }
  return true;
}, { message: '복수전공/부전공 학과를 선택해주세요.' });

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
    Sentry.captureException(error);
    return Response.json(
      { success: false, error: '온보딩 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
