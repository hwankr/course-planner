/**
 * @api-separable
 * @endpoint POST /api/admin/seed-academic-events - 학사 일정 시드 데이터 삽입
 * @service academicEventService.create
 * @migration-notes Express 변환 시: app.post('/api/admin/seed-academic-events', ...)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { academicEventService } from '@/services';
import type { AcademicEventCategory } from '@/types';
import * as Sentry from '@sentry/nextjs';

interface SeedEvent {
  title: string;
  startDate: string;
  endDate?: string;
  category: AcademicEventCategory;
}

/**
 * 2026학년도 학사일정 (1학기: 2026.02~06, 2학기: 2026.09~12, 겨울: 2027.01~02)
 */
const ACADEMIC_EVENTS_2026: SeedEvent[] = [
  // ===== 2026년 2월 (1학기 준비) =====
  { title: '추가휴학원서접수', startDate: '2026-02-02', endDate: '2026-02-27', category: 'registration' },
  { title: '추가재입학원서접수', startDate: '2026-02-04', endDate: '2026-02-06', category: 'registration' },
  { title: '수강신청', startDate: '2026-02-11', endDate: '2026-02-13', category: 'registration' },
  { title: '등록기간', startDate: '2026-02-19', endDate: '2026-02-23', category: 'registration' },
  { title: '학위수여식', startDate: '2026-02-20', category: 'academic' },
  { title: '추가복학원서접수', startDate: '2026-02-25', endDate: '2026-02-27', category: 'registration' },
  { title: '입학식', startDate: '2026-02-26', category: 'academic' },

  // ===== 2026년 3월 =====
  { title: '학기개시일', startDate: '2026-03-01', category: 'academic' },
  { title: '개강', startDate: '2026-03-03', category: 'academic' },
  { title: '수업일수 1/4', startDate: '2026-03-27', category: 'academic' },
  { title: '학기개시일(30일)', startDate: '2026-03-30', category: 'academic' },

  // ===== 2026년 4월 =====
  { title: '중간시험', startDate: '2026-04-21', endDate: '2026-04-27', category: 'exam' },
  { title: '수업일수 1/2', startDate: '2026-04-23', category: 'academic' },
  { title: '학기개시일(60일)', startDate: '2026-04-29', category: 'academic' },

  // ===== 2026년 5월 =====
  { title: '수업일수 3/4', startDate: '2026-05-22', category: 'academic' },
  { title: '학기개시일(90일)', startDate: '2026-05-29', category: 'academic' },

  // ===== 2026년 6월 =====
  { title: '공휴일수업대체지정일 (05.01 근로자의날)', startDate: '2026-06-09', category: 'academic' },
  { title: '공휴일수업대체지정일 (05.05 어린이날)', startDate: '2026-06-10', category: 'academic' },
  { title: '공휴일수업대체지정일 (05.25 부처님오신날 대체공휴일)', startDate: '2026-06-11', category: 'academic' },
  { title: '공휴일수업대체지정일 (06.03 전국동시지방선거)', startDate: '2026-06-12', category: 'academic' },
  { title: '기말시험', startDate: '2026-06-15', endDate: '2026-06-19', category: 'exam' },
  { title: '방학', startDate: '2026-06-22', category: 'academic' },

  // ===== 2026년 7월 =====
  { title: '복학·재입학원서접수', startDate: '2026-07-01', endDate: '2026-07-03', category: 'registration' },
  { title: '휴학원서접수', startDate: '2026-07-01', endDate: '2026-07-03', category: 'registration' },

  // ===== 2026년 8월 (2학기 준비) =====
  { title: '수강신청', startDate: '2026-08-11', endDate: '2026-08-13', category: 'registration' },
  { title: '등록기간', startDate: '2026-08-18', endDate: '2026-08-20', category: 'registration' },
  { title: '학위수여식', startDate: '2026-08-21', category: 'academic' },

  // ===== 2026년 9월 =====
  { title: '학기개시일', startDate: '2026-09-01', category: 'academic' },
  { title: '개강', startDate: '2026-09-01', category: 'academic' },
  { title: '수업일수 1/4', startDate: '2026-09-29', category: 'academic' },
  { title: '학기개시일(30일)', startDate: '2026-09-30', category: 'academic' },

  // ===== 2026년 10월 =====
  { title: '중간시험', startDate: '2026-10-20', endDate: '2026-10-26', category: 'exam' },
  { title: '수업일수 1/2', startDate: '2026-10-28', category: 'academic' },
  { title: '학기개시일(60일)', startDate: '2026-10-30', category: 'academic' },

  // ===== 2026년 11월 =====
  { title: '수업일수 3/4', startDate: '2026-11-24', category: 'academic' },
  { title: '학기개시일(90일)', startDate: '2026-11-29', category: 'academic' },

  // ===== 2026년 12월 =====
  { title: '공휴일수업대체지정일 (09.24 추석연휴)', startDate: '2026-12-08', category: 'academic' },
  { title: '공휴일수업대체지정일 (09.25 추석연휴)', startDate: '2026-12-09', category: 'academic' },
  { title: '공휴일수업대체지정일 (10.05 개천절 대체공휴일)', startDate: '2026-12-10', category: 'academic' },
  { title: '공휴일수업대체지정일 (10.09 한글날)', startDate: '2026-12-11', category: 'academic' },
  { title: '기말시험', startDate: '2026-12-14', endDate: '2026-12-18', category: 'exam' },
  { title: '방학', startDate: '2026-12-21', category: 'academic' },
  { title: '개교기념일', startDate: '2026-12-22', category: 'academic' },

  // ===== 2027년 1월 =====
  { title: '복학·재입학원서접수', startDate: '2027-01-04', endDate: '2027-01-06', category: 'registration' },
  { title: '휴학원서접수', startDate: '2027-01-04', endDate: '2027-01-06', category: 'registration' },

  // ===== 2027년 2월 =====
  { title: '수강신청', startDate: '2027-02-10', endDate: '2027-02-12', category: 'registration' },
  { title: '등록기간', startDate: '2027-02-16', endDate: '2027-02-18', category: 'registration' },
  { title: '학위수여식', startDate: '2027-02-22', category: 'academic' },
];

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    let created = 0;

    for (const event of ACADEMIC_EVENTS_2026) {
      await academicEventService.create(
        {
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate,
          category: event.category,
          isHoliday: false,
        },
        session.user.id
      );
      created++;
    }

    return NextResponse.json({
      success: true,
      message: `${created}개의 학사 일정이 등록되었습니다.`,
      data: { count: created },
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: '학사 일정 시드 데이터 삽입에 실패했습니다.' },
      { status: 500 }
    );
  }
}
