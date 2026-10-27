'use client';

import { X } from 'lucide-react';
import type { Types } from 'mongoose';
import { CategoryLabel, STATUS_LABELS, STATUS_TEXT_CLASS } from '@/components/ui';
import { cn } from '@/lib/utils';

type CourseStatus = 'planned' | 'enrolled' | 'completed' | 'failed';

interface CourseCardProps {
  course: {
    _id?: Types.ObjectId | string;  // From API (catalog)
    id?: string;                     // From plan (semester)
    code: string;
    name: string;
    credits: number;
    category?: 'major_required' | 'major_compulsory' | 'major_elective' | 'general_required' | 'general_elective' | 'free_elective' | 'teaching';
    status?: CourseStatus;
  };
  index?: number;        // Optional: only needed in SemesterColumn
  onRemove?: () => void; // Optional: only shown in SemesterColumn
  onStatusChange?: (courseId: string, newStatus: CourseStatus) => void; // Optional: for status updates
  isDragDisabled?: boolean; // Optional: for catalog items already in plan
  compact?: boolean;     // Kept for call-site compatibility; rows are always one density
  departmentLabel?: string;  // e.g. "복수전공", "부전공"
  /** default: 52px 행 · tall: 56px 행 (모바일) */
  size?: 'default' | 'tall';
  /** 드래그 오버레이처럼 떠 있는 상태로 그릴 때 */
  floating?: boolean;
  className?: string;
}

// Helper to toggle status: planned <-> completed (2-step toggle)
function getNextStatus(current: CourseStatus): CourseStatus {
  // Toggle between planned and completed; any other status → completed
  return current === 'completed' ? 'planned' : 'completed';
}

/**
 * 과목 행: 이름 · 캡션(● 카테고리 · 코드) · 상태 글자 · 학점.
 * 상태 글자를 누르면 예정 ↔ 이수로 바뀌고, 삭제(✕)는 행에 마우스를 올렸을 때 보인다.
 */
export function CourseCard({
  course,
  onRemove,
  onStatusChange,
  isDragDisabled,
  departmentLabel,
  size = 'default',
  floating = false,
  className,
}: CourseCardProps) {
  // Default status to 'planned' if not provided (for catalog view)
  const status = course.status || 'planned';

  // Get course ID (from either _id or id field)
  const courseId = (course.id || course._id?.toString()) ?? '';

  // Handle status click
  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStatusChange && courseId) {
      onStatusChange(courseId, getNextStatus(status));
    }
  };

  const suffix = departmentLabel ? `${course.code} · ${departmentLabel}` : course.code;

  return (
    <div
      className={cn(
        'group/row flex items-center gap-3 border-b border-line bg-white md:gap-4',
        size === 'tall' ? 'h-14' : 'h-[52px]',
        isDragDisabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing',
        floating && 'rounded-none border-b-0 px-3 shadow-float',
        className
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] leading-5 font-medium text-ink">{course.name}</span>
        <CategoryLabel category={course.category} suffix={suffix} className="min-w-0" />
      </div>

      {course.status && onStatusChange ? (
        <button
          type="button"
          onClick={handleStatusClick}
          className={cn(
            'h-11 shrink-0 px-1 text-[13px] transition-colors duration-150 ease-out hover:opacity-80 md:h-7',
            STATUS_TEXT_CLASS[status]
          )}
          aria-label={`${course.name} 상태 바꾸기, 현재 ${STATUS_LABELS[status]}`}
          title="누르면 예정 ↔ 이수로 바뀌어요"
        >
          {STATUS_LABELS[status]}
        </button>
      ) : course.status ? (
        <span className={cn('shrink-0 px-1 text-[13px]', STATUS_TEXT_CLASS[status])}>
          {STATUS_LABELS[status]}
        </span>
      ) : null}

      <span className="w-10 shrink-0 text-right text-[14px] font-semibold tabular-nums text-ink">
        {course.credits}학점
      </span>

      {onRemove && !isDragDisabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="-mr-2 inline-flex h-11 w-9 shrink-0 items-center justify-center text-placeholder transition-[color,opacity] duration-150 ease-out hover:text-negative focus-visible:opacity-100 md:h-8 md:w-8 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/row:opacity-100"
          aria-label={`${course.name} 학기에서 빼기`}
        >
          <X aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
        </button>
      )}
    </div>
  );
}
