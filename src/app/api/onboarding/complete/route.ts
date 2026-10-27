/**
 * @api-separable
 * @endpoint POST /api/onboarding/complete
 * @service onboardingService.completeOnboarding
 * @migration-notes Express 변환 시: app.post('/api/onboarding/complete', ...)
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { onboardingService } from '@/services/onboarding.service';
import { validatePriorCredits } from '@/lib/priorCredits';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';

const completeOnboardingSchema = z.object({
  departmentId: z.string().min(1, '학과를 선택해주세요.'),
  majorType: z.enum(['single', 'double', 'minor']).default('single'),
  secondaryDepartmentId: z.string().optional(),
  enrollmentYear: z.number({ error: '입학연도을 숫자로 입력해주세요.' }).int('입학연도은 정수로 입력해주세요.').min(2000, '입학연도은 2000 이상이어야 합니다.').max(2100, '연도는 2100 이하여야 합니다.'),
  graduationRequirements: z.object({
    majorType: z.enum(['single', 'double', 'minor']),
    totalCredits: z.number({ error: '졸업학점을 숫자로 입력해주세요.' }).int('졸업학점은 정수로 입력해주세요.').min(1, '졸업학점은 1 이상이어야 합니다.'),
    generalCredits: z.number({ error: '교양학점을 숫자로 입력해주세요.' }).int('교양학점은 정수로 입력해주세요.').min(0, '교양학점은 0 이상이어야 합니다.'),

    primaryMajorCredits: z.number({ error: '전공학점을 숫자로 입력해주세요.' }).int('전공학점은 정수로 입력해주세요.').min(0, '전공학점은 0 이상이어야 합니다.'),
    primaryMajorRequiredMin: z.number({ error: '전공핵심 학점을 숫자로 입력해주세요.' }).int('전공핵심 학점은 정수로 입력해주세요.').min(0, '전공핵심 학점은 0 이상이어야 합니다.'),

    secondaryMajorCredits: z.number({ error: '복수전공 학점을 숫자로 입력해주세요.' }).int('복수전공 학점은 정수로 입력해주세요.').min(0, '복수전공 학점은 0 이상이어야 합니다.').optional(),
    secondaryMajorRequiredMin: z.number({ error: '복수전공 핵심학점을 숫자로 입력해주세요.' }).int('복수전공 핵심학점은 정수로 입력해주세요.').min(0, '복수전공 핵심학점은 0 이상이어야 합니다.').optional(),

    minorCredits: z.number({ error: '부전공 학점을 숫자로 입력해주세요.' }).int('부전공 학점은 정수로 입력해주세요.').min(0, '부전공 학점은 0 이상이어야 합니다.').optional(),
    minorRequiredMin: z.number({ error: '부전공 핵심학점을 숫자로 입력해주세요.' }).int('부전공 핵심학점은 정수로 입력해주세요.').min(0, '부전공 핵심학점은 0 이상이어야 합니다.').optional(),
    minorPrimaryMajorMin: z.number({ error: '부전공 주전공 최소학점을 숫자로 입력해주세요.' }).int('부전공 주전공 최소학점은 정수로 입력해주세요.').min(0, '부전공 주전공 최소학점은 0 이상이어야 합니다.').optional(),

    earnedTotalCredits: z.number({ error: '기이수 졸업학점을 숫자로 입력해주세요.' }).int('기이수 졸업학점은 정수로 입력해주세요.').min(0, '기이수 졸업학점은 0 이상이어야 합니다.'),
    earnedGeneralCredits: z.number({ error: '기이수 교양학점을 숫자로 입력해주세요.' }).int('기이수 교양학점은 정수로 입력해주세요.').min(0, '기이수 교양학점은 0 이상이어야 합니다.'),
    earnedPrimaryMajorCredits: z.number({ error: '기이수 전공학점을 숫자로 입력해주세요.' }).int('기이수 전공학점은 정수로 입력해주세요.').min(0, '기이수 전공학점은 0 이상이어야 합니다.'),
    earnedPrimaryMajorRequiredCredits: z.number({ error: '기이수 전공핵심학점을 숫자로 입력해주세요.' }).int('기이수 전공핵심학점은 정수로 입력해주세요.').min(0, '기이수 전공핵심학점은 0 이상이어야 합니다.'),
    earnedSecondaryMajorCredits: z.number({ error: '기이수 복수전공 학점을 숫자로 입력해주세요.' }).int('기이수 복수전공 학점은 정수로 입력해주세요.').min(0, '기이수 복수전공 학점은 0 이상이어야 합니다.').optional(),
    earnedSecondaryMajorRequiredCredits: z.number({ error: '기이수 복수전공 핵심학점을 숫자로 입력해주세요.' }).int('기이수 복수전공 핵심학점은 정수로 입력해주세요.').min(0, '기이수 복수전공 핵심학점은 0 이상이어야 합니다.').optional(),
    earnedMinorCredits: z.number({ error: '기이수 부전공 학점을 숫자로 입력해주세요.' }).int('기이수 부전공 학점은 정수로 입력해주세요.').min(0, '기이수 부전공 학점은 0 이상이어야 합니다.').optional(),
    earnedMinorRequiredCredits: z.number({ error: '기이수 부전공 핵심학점을 숫자로 입력해주세요.' }).int('기이수 부전공 핵심학점은 정수로 입력해주세요.').min(0, '기이수 부전공 핵심학점은 0 이상이어야 합니다.').optional(),
    requirementYear: z.number({ error: '기준 연도을 숫자로 입력해주세요.' }).int('기준 연도은 정수로 입력해주세요.').min(2020, '기준 연도은 2020 이상이어야 합니다.').max(2100, '연도는 2100 이하여야 합니다.').optional(),
  }).superRefine((data, ctx) => {
    // 기이수 필드 간 정합성 (총 >= 트랙 합계, 핵심 <= 전공)
    for (const message of Object.values(validatePriorCredits(data))) {
      ctx.addIssue({ code: 'custom', message });
    }
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
