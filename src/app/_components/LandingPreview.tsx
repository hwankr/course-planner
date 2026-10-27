import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

// 랜딩 히어로의 정적 앱 화면 목업 (.design-ref/Landing "서비스 화면 미리보기")
// 실제 데이터와 무관한 장식용 마크업이라 보조기기에는 요약 라벨만 노출한다.

const SUMMARY_ROWS = [
  { label: '전공', earned: 54, required: 72, sub: false },
  { label: '전공핵심', earned: 21, required: 30, sub: true },
  { label: '교양', earned: 27, required: 36, sub: false },
  { label: '자유선택', earned: 0, required: 22, sub: false },
];

interface PreviewCourse {
  name: string;
  category: string;
  dotClass: string;
  code: string;
  status: '수강중' | '예정';
}

const CURRENT_COURSES: PreviewCourse[] = [
  { name: '알고리즘', category: '전공핵심', dotClass: 'bg-cat-major-required', code: 'CSE2001', status: '수강중' },
  { name: '운영체제', category: '전공핵심', dotClass: 'bg-cat-major-required', code: 'CSE2003', status: '수강중' },
  { name: '컴퓨터구조', category: '전공필수', dotClass: 'bg-cat-major-compulsory', code: 'CSE2004', status: '수강중' },
];

const PLANNED_COURSES: PreviewCourse[] = [
  { name: '컴퓨터네트워크', category: '전공핵심', dotClass: 'bg-cat-major-required', code: 'CSE2008', status: '예정' },
  { name: '인공지능개론', category: '전공선택', dotClass: 'bg-cat-major-elective', code: 'CSE2010', status: '예정' },
];

function PreviewCourseRow({ course }: { course: PreviewCourse }) {
  return (
    <div className="flex h-12 items-center gap-3 border-b border-line">
      <span className="flex min-w-0 flex-auto flex-col gap-px">
        <span className="truncate text-[14px] font-medium">{course.name}</span>
        <span className="inline-flex items-center gap-[5px] text-[12px] text-ink-2">
          <span aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full', course.dotClass)} />
          {course.category} · {course.code}
        </span>
      </span>
      <span
        className={cn(
          'text-[12px]',
          course.status === '수강중' ? 'font-semibold text-primary' : 'font-medium text-ink-2'
        )}
      >
        {course.status}
      </span>
      <span className="text-[13px] font-semibold tabular-nums">3학점</span>
    </div>
  );
}

export function LandingPreview() {
  return (
    <div
      role="img"
      aria-label="서비스 화면 미리보기: 졸업까지 49학점 남음, 2학년 1·2학기 수강 계획"
      className="mt-12 flex h-[460px] items-stretch overflow-hidden rounded-[12px] border border-line-2 bg-white select-none md:mt-[72px] md:h-[520px]"
    >
      <div aria-hidden="true" className="hidden w-[200px] shrink-0 flex-col gap-6 border-r border-line px-3.5 py-6 md:flex">
        <span className="px-2.5 text-[14px] font-bold tracking-[-0.02em]">YU 수강 플래너</span>
        <div className="flex flex-col gap-0.5">
          <span className="flex h-9 items-center rounded-[8px] bg-fill px-2.5 text-[13px] font-semibold">수강 계획</span>
          <span className="flex h-9 items-center px-2.5 text-[13px] font-medium text-ink-2">학사 일정</span>
          <span className="flex h-9 items-center px-2.5 text-[13px] font-medium text-ink-2">학과 통계</span>
        </div>
      </div>

      <div aria-hidden="true" className="flex min-w-0 flex-1 flex-col px-5 py-6 md:px-9 md:py-7">
        <div className="flex items-end justify-between gap-3 pb-5">
          <div className="flex flex-col gap-1">
            <span className="text-[22px] leading-7 font-bold tracking-[-0.02em]">수강 계획</span>
            <span className="text-[13px] text-ink-2">컴퓨터공학과 · 2024년 졸업 요건 기준</span>
          </div>
          <span className="text-[13px] font-semibold">내보내기</span>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-10 border-y border-line-2 pt-6 pb-7">
          <div className="flex flex-col">
            <span className="text-[13px] leading-[18px] font-medium text-ink-2">졸업까지</span>
            <span className="mt-1 text-[28px] leading-9 font-bold tracking-[-0.03em] md:text-[36px] md:leading-[44px]">
              49학점 남았어요
            </span>
            <div className="mt-5 flex h-1.5 overflow-hidden rounded-[3px] bg-line">
              <div className="w-[62.3%] bg-primary" />
              <div className="w-[11.5%] bg-primary/45" />
              <div className="w-[16.2%] bg-bar-mid" />
            </div>
            <div className="mt-2.5 flex justify-between gap-3 text-[13px]">
              <span className="font-semibold tabular-nums">
                81 / 130학점 <span className="font-medium text-ink-2">· 이수 62%</span>
              </span>
              <span className="font-semibold text-primary">계획 반영 시 90%</span>
            </div>
          </div>
          <div className="flex flex-col">
            {SUMMARY_ROWS.map((row, i) => (
              <div
                key={row.label}
                className={cn(
                  'flex h-10 items-center justify-between text-[14px]',
                  i < SUMMARY_ROWS.length - 1 && 'border-b border-line',
                  row.sub && 'pl-3.5'
                )}
              >
                <span className={row.sub ? 'font-medium text-ink-2' : 'font-semibold'}>{row.label}</span>
                <span className="font-semibold tabular-nums">
                  {row.earned} <span className="font-medium text-ink-2">/ {row.required}학점</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-x-10 pt-6">
          <div className="flex flex-col">
            <div className="flex h-9 items-baseline justify-between border-b border-line-3 text-[14px]">
              <span className="font-bold">
                2학년 1학기 <span className="text-[12px] font-medium text-ink-2">15학점 · 수강중</span>
              </span>
            </div>
            {CURRENT_COURSES.map((course) => (
              <PreviewCourseRow key={course.code} course={course} />
            ))}
          </div>
          <div className="flex flex-col">
            <div className="flex h-9 items-baseline justify-between border-b-2 border-primary text-[14px]">
              <span className="font-bold text-primary">
                2학년 2학기 <span className="text-[12px] font-medium text-ink-2">9학점 · 예정</span>
              </span>
              <span className="text-[12px] font-semibold text-primary">선택됨</span>
            </div>
            {PLANNED_COURSES.map((course) => (
              <PreviewCourseRow key={course.code} course={course} />
            ))}
            <div className="flex h-12 items-center gap-1.5 text-[13px] font-semibold text-primary">
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              과목 추가
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
