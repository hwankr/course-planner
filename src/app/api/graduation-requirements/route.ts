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
import * as Sentry from '@sentry/nextjs';

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
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '졸업요건을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

const upsertSchema = z.object({
  majorType: z.enum(['single', 'double', 'minor']),

  totalCredits: z.number().min(1),
  generalCredits: z.number().min(0),

  primaryMajorCredits: z.number().min(0),
  primaryMajorRequiredMin: z.number().min(0),

  secondaryMajorCredits: z.number().min(0).optional(),
  secondaryMajorRequiredMin: z.number().min(0).optional(),

  minorCredits: z.number().min(0).optional(),
  minorRequiredMin: z.number().min(0).optional(),
  minorPrimaryMajorMin: z.number().min(0).optional(),

  earnedTotalCredits: z.number().min(0),
  earnedGeneralCredits: z.number().min(0),
  earnedPrimaryMajorCredits: z.number().min(0),
  earnedPrimaryMajorRequiredCredits: z.number().min(0),
  earnedSecondaryMajorCredits: z.number().min(0).optional(),
  earnedSecondaryMajorRequiredCredits: z.number().min(0).optional(),
  earnedMinorCredits: z.number().min(0).optional(),
  earnedMinorRequiredCredits: z.number().min(0).optional(),

  requirementYear: z.number().min(2020).max(2100).optional(),
})
.refine(data => {
  if (data.majorType === 'double') {
    return data.secondaryMajorCredits !== undefined && data.secondaryMajorRequiredMin !== undefined;
  }
  return true;
}, { message: '복수전공 요건은 필수입니다.' })
.refine(data => {
  if (data.majorType === 'minor') {
    return data.minorCredits !== undefined && data.minorRequiredMin !== undefined && data.minorPrimaryMajorMin !== undefined;
  }
  return true;
}, { message: '부전공 요건은 필수입니다.' })
.refine(data => {
  const secondary = data.majorType === 'double' ? (data.secondaryMajorCredits ?? 0) : 0;
  const minor = data.majorType === 'minor' ? (data.minorCredits ?? 0) : 0;
  return data.primaryMajorCredits + secondary + minor + data.generalCredits <= data.totalCredits;
}, { message: '전공+교양 학점 합이 졸업학점을 초과합니다.' });

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
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '졸업요건 저장에 실패했습니다.' },
      { status: 500 }
    );
  }
}
