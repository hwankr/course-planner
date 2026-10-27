'use client';

import { useState } from 'react';
import { CategoryLabel } from '@/components/ui';
import { cn } from '@/lib/utils';
import { SEMESTER_META_WRAP_CLASS, SemesterMeta } from './SemesterMeta';

interface ReadOnlySemesterColumnProps {
  semester: {
    year: number;
    term: string;
    courses: Array<{
      code: string;
      name: string;
      credits: number;
      category?: string;
    }>;
  };
  compact?: boolean;
}

/** 다른 사람 계획 보기용 학기: 머리줄 + 과목 행(상태·삭제 없음) */
export function ReadOnlySemesterColumn({ semester, compact = false }: ReadOnlySemesterColumnProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const termLabel = semester.term === 'spring' ? '1학기' : '2학기';
  const title = `${semester.year}학년 ${termLabel}`;
  const meta = (
    <SemesterMeta
      courses={semester.courses}
      showStatus={false}
      extra={`${semester.courses.length}과목`}
      className={SEMESTER_META_WRAP_CLASS}
    />
  );

  return (
    <div className="flex min-w-0 flex-col">
      {compact ? (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          className="flex min-h-10 items-baseline justify-between gap-3 border-b border-line-3 pt-2.5 pb-1.5 text-left text-ink"
        >
          <span className="min-w-0 text-[15px] leading-5 font-bold">
            {title}
            {meta}
          </span>
          <span className="shrink-0 text-[12px] font-semibold text-ink-2">{isExpanded ? '접기' : '펼치기'}</span>
        </button>
      ) : (
        <h4 className="m-0 min-h-10 border-b border-line-3 pt-2.5 pb-1.5 text-[15px] leading-5 font-bold text-ink">
          {title}
          {meta}
        </h4>
      )}

      {isExpanded && (
        <ul className="m-0 list-none p-0">
          {semester.courses.map((course, idx) => (
            <li
              key={`${course.code}-${idx}`}
              className="flex h-[52px] items-center gap-4 border-b border-line"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-[15px] leading-5 font-medium text-ink">{course.name}</span>
                <CategoryLabel category={course.category} suffix={course.code} className="min-w-0" />
              </div>
              <span className="w-10 shrink-0 text-right text-[14px] font-semibold tabular-nums text-ink">
                {course.credits}학점
              </span>
            </li>
          ))}
          {semester.courses.length === 0 && (
            <li className={cn('flex h-[52px] items-center border-b border-line text-[13px] text-ink-2')}>
              과목이 없어요
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
