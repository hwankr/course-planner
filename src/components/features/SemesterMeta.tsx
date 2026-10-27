import { STATUS_TEXT_CLASS } from '@/components/ui/StatusText';
import { cn } from '@/lib/utils';

type MetaCourse = {
  credits: number;
  category?: string;
  status?: 'planned' | 'enrolled' | 'completed' | 'failed';
};

const CATEGORY_ORDER = ['major_required', 'major_compulsory', 'major_elective', 'general_required', 'general_elective', 'teaching', 'free_elective'];

const CATEGORY_SHORT_LABELS: Record<string, string> = {
  major_required: '전핵',
  major_compulsory: '전필',
  major_elective: '전선',
  general_required: '교필',
  general_elective: '교선',
  teaching: '교직',
  free_elective: '자선',
};

/** 학기 카테고리별 학점 합계 — "전핵 3 · 교선 3" */
export function getCategoryBreakdown(courses: MetaCourse[]) {
  const counts: Record<string, number> = {};
  for (const course of courses) {
    const cat = course.category || 'free_elective';
    counts[cat] = (counts[cat] || 0) + course.credits;
  }
  return CATEGORY_ORDER
    .filter((cat) => counts[cat])
    .map((cat) => ({ key: cat, label: CATEGORY_SHORT_LABELS[cat], credits: counts[cat] }));
}

/** 학기 진행 상태 — 재수강은 따로 센다. 나머지가 모두 이수면 상태를 붙이지 않는다. */
export function getSemesterStatus(courses: MetaCourse[]) {
  const failed = courses.filter((c) => c.status === 'failed').length;
  const rest = courses.filter((c) => c.status !== 'failed');
  let progress: '수강중' | '예정' | null = null;
  if (rest.some((c) => c.status === 'enrolled')) progress = '수강중';
  else if (rest.some((c) => c.status === 'planned')) progress = '예정';
  return { progress, failed };
}

/**
 * 학기 머리줄에서 메타를 자르지 않고 보여주는 배치:
 * md 미만은 제목 아래 둘째 줄(12/16), md 이상은 제목 뒤에 이어 쓰고 넘치면 줄바꿈.
 */
export const SEMESTER_META_WRAP_CLASS = 'block text-[12px] leading-4 md:ml-1 md:inline md:text-[13px] md:leading-5';

/** 학기 메타 (13/500 Ink2): "9학점 · 예정 · 재수강 1 · 전핵 3 · 교선 3" */
export function SemesterMeta({
  courses,
  showStatus = true,
  extra,
  className,
}: {
  courses: MetaCourse[];
  showStatus?: boolean;
  /** 학점 뒤에 붙는 내용 — 예: "4과목" */
  extra?: string;
  className?: string;
}) {
  const total = courses.reduce((sum, c) => sum + c.credits, 0);
  const { progress, failed } = showStatus ? getSemesterStatus(courses) : { progress: null, failed: 0 };
  const breakdown = getCategoryBreakdown(courses);

  return (
    <span className={cn('text-[13px] font-medium text-ink-2 tabular-nums', className)}>
      {total}학점
      {extra && <> · {extra}</>}
      {progress && <> · {progress}</>}
      {failed > 0 && (
        <>
          {' · '}
          <span className={STATUS_TEXT_CLASS.failed}>재수강 {failed}</span>
        </>
      )}
      {breakdown.length > 0 && <> · {breakdown.map((c) => `${c.label} ${c.credits}`).join(' · ')}</>}
    </span>
  );
}
