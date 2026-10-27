'use client';

import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { CourseCard } from './CourseCard';
import { SEMESTER_META_WRAP_CLASS, SemesterMeta } from './SemesterMeta';
import { usePlanStore } from '@/stores/planStore';
import { cn } from '@/lib/utils';

type CourseStatus = 'planned' | 'enrolled' | 'completed' | 'failed';

interface SemesterColumnProps {
  semester: {
    year: number;
    term: 'spring' | 'fall';
    courses: Array<{
      id: string;
      code: string;
      name: string;
      credits: number;
      category?: 'major_required' | 'major_compulsory' | 'major_elective' | 'general_required' | 'general_elective' | 'free_elective' | 'teaching';
      status: CourseStatus;
    }>;
  };
  onRemoveCourse: (courseId: string) => void;
  onDelete?: () => void;
  onClear?: () => void;
  isFocused?: boolean;
  onFocus?: () => void;
  compact?: boolean;     // Kept for call-site compatibility
  onStatusChange?: (courseId: string, newStatus: CourseStatus) => void;
  /** false면 머리줄을 그리지 않는다 (모바일 선택 학기 화면이 자체 머리줄을 가짐) */
  showHeader?: boolean;
  /** 과목 행 높이: default 52 · tall 56 (모바일) */
  rowSize?: 'default' | 'tall';
  /** 선택된 학기 안내 문구 */
  focusHint?: string;
}

function DraggableSemesterCourse({
  course,
  containerId,
  rowSize,
  onRemove,
  onStatusChange,
}: {
  course: SemesterColumnProps['semester']['courses'][number];
  containerId: string;
  rowSize: 'default' | 'tall';
  onRemove: () => void;
  onStatusChange?: (courseId: string, newStatus: CourseStatus) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: course.id,
    data: { containerId, course, type: 'semester' },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={isDragging ? 'opacity-40' : ''}
      // 평소엔 세로 스와이프를 브라우저 스크롤에 맡기고, 길게 눌러 드래그가 켜진 뒤에만 막는다
      style={{ transform: CSS.Translate.toString(transform), touchAction: isDragging ? 'none' : 'pan-y' }}
    >
      <CourseCard
        course={course}
        size={rowSize}
        onRemove={onRemove}
        onStatusChange={onStatusChange}
      />
    </div>
  );
}

export function SemesterColumn({
  semester,
  onRemoveCourse,
  onDelete,
  onClear,
  isFocused = false,
  onFocus,
  onStatusChange,
  showHeader = true,
  rowSize = 'default',
  focusHint = '과목 리스트에서 + 를 누르면 여기에 추가돼요',
}: SemesterColumnProps) {
  const isExporting = usePlanStore((s) => s.isExporting);
  const droppableId = `semester-${semester.year}-${semester.term}`;
  const termLabel = semester.term === 'spring' ? '1학기' : '2학기';
  const title = `${semester.year}학년 ${termLabel}`;
  const focused = isFocused && !isExporting;

  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  const handleClear = () => {
    if (!onClear) return;
    if (window.confirm(`이 학기의 모든 과목(${semester.courses.length}개)을 제거하시겠습니까?`)) {
      onClear();
    }
  };

  const handleDelete = () => {
    if (!onDelete) return;
    if (semester.courses.length > 0) {
      if (window.confirm(`이 학기에 ${semester.courses.length}개의 과목이 있습니다. 정말 삭제하시겠습니까?`)) {
        onDelete();
      }
    } else {
      onDelete();
    }
  };

  const actionClass =
    'h-11 px-1.5 text-[12px] font-semibold text-ink-2 transition-[color,opacity] duration-150 ease-out hover:text-negative focus-visible:opacity-100 md:h-8 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/sem:opacity-100 [@media(hover:hover)]:group-focus-within/sem:opacity-100';

  const actions = !isExporting && (onClear || onDelete) && (
    <div data-export-ignore className="flex shrink-0 items-center">
      {onClear && semester.courses.length > 0 && (
        <button type="button" onClick={handleClear} className={actionClass} aria-label={`${title} 비우기`}>
          비우기
        </button>
      )}
      {onDelete && (
        <button type="button" onClick={handleDelete} className={actionClass} aria-label={`${title} 삭제`}>
          삭제
        </button>
      )}
    </div>
  );

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'group/sem flex min-w-0 flex-col transition-colors duration-150 ease-out',
        isOver && 'bg-fill'
      )}
    >
      {showHeader && (
        <div
          className={cn(
            'flex items-center gap-2 border-b',
            focused ? 'border-b-2 border-primary' : 'border-line-3'
          )}
        >
          <button
            type="button"
            onClick={onFocus}
            aria-pressed={focused}
            className={cn(
              'flex min-h-10 min-w-0 flex-1 items-baseline justify-between gap-3 pt-2.5 pb-1.5 text-left transition-colors duration-150 ease-out',
              focused ? 'text-primary' : 'text-ink hover:text-primary'
            )}
          >
            <span className="min-w-0 text-[15px] leading-5 font-bold">
              {title}
              <SemesterMeta courses={semester.courses} className={SEMESTER_META_WRAP_CLASS} />
            </span>
            {focused && <span className="shrink-0 text-[12px] font-semibold text-primary">선택됨</span>}
          </button>
          {actions}
        </div>
      )}

      {semester.courses.map((course) => (
        <DraggableSemesterCourse
          key={course.id}
          course={course}
          containerId={droppableId}
          rowSize={rowSize}
          onRemove={() => onRemoveCourse(course.id)}
          onStatusChange={onStatusChange}
        />
      ))}

      {semester.courses.length === 0 && (
        <div
          className={cn(
            'flex items-center border-b border-line text-[13px] text-ink-2',
            rowSize === 'tall' ? 'h-14' : 'h-[52px]'
          )}
        >
          아직 과목이 없어요
        </div>
      )}

      {focused && showHeader && (
        <span data-export-ignore className="inline-flex h-11 items-center text-[13px] font-semibold text-primary">
          {focusHint}
        </span>
      )}

      {!showHeader && actions && (
        <div className="flex justify-end pt-1">{actions}</div>
      )}
    </div>
  );
}
