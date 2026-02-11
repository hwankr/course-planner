/**
 * @api-separable
 * @endpoint GET /api/academic-events - 학사 일정 목록 조회
 * @endpoint POST /api/academic-events - 학사 일정 생성 (관리자)
 * @service academicEventService.findAll, academicEventService.create
 * @migration-notes Express 변환 시: app.get('/api/academic-events', ...), app.post('/api/academic-events', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { academicEventService } from '@/services';
import { getKoreanHolidaysForMonth } from '@/lib/koreanHolidays';
import { z } from 'zod';
import type { AcademicEventCategory } from '@/types';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : undefined;
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!, 10) : undefined;
    const category = searchParams.get('category') as AcademicEventCategory | undefined;
    const includeHolidays = searchParams.get('holidays') !== 'false';

    const events = await academicEventService.findAll({ year, month, category });

    // 공휴일 포함 옵션
    let holidays: Array<{ title: string; startDate: string; category: 'holiday'; isHoliday: true }> = [];
    if (includeHolidays && year && month) {
      const koreanHolidays = getKoreanHolidaysForMonth(year, month);
      holidays = koreanHolidays.map((h) => ({
        title: h.name,
        startDate: h.date,
        category: 'holiday' as const,
        isHoliday: true as const,
      }));
    }

    return NextResponse.json({
      success: true,
      data: { events, holidays },
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '학사 일정을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

const createEventSchema = z.object({
  title: z.string().min(1, '일정 제목은 필수입니다.').max(100),
  description: z.string().max(500).optional(),
  startDate: z.string().min(1, '시작 날짜는 필수입니다.'),
  endDate: z.string().optional(),
  category: z.enum(['academic', 'registration', 'exam', 'holiday', 'other']),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  isHoliday: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createEventSchema.parse(body);

    const event = await academicEventService.create(validatedData, session.user.id);

    return NextResponse.json({
      success: true,
      data: event,
      message: '학사 일정이 생성되었습니다.',
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
      { success: false, error: '학사 일정 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
