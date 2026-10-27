import * as React from 'react';
import { cn } from '@/lib/utils';

export type CourseStatusValue = 'planned' | 'enrolled' | 'completed' | 'failed';

export const STATUS_LABELS: Record<CourseStatusValue, string> = {
  planned: '예정',
  enrolled: '수강중',
  completed: '이수',
  failed: '재수강',
};

/** 상태는 글자색으로만: 이수 Positive · 수강중 Primary · 예정 Ink2 · 재수강 Negative */
export const STATUS_TEXT_CLASS: Record<CourseStatusValue, string> = {
  planned: 'text-ink-2 font-medium',
  enrolled: 'text-primary font-semibold',
  completed: 'text-positive font-semibold',
  failed: 'text-negative font-semibold',
};

export interface StatusTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: CourseStatusValue;
  /** 기본 라벨 대신 표시할 글자 */
  label?: React.ReactNode;
}

export function StatusText({ status, label, className, ...props }: StatusTextProps) {
  return (
    <span className={cn('text-[13px]', STATUS_TEXT_CLASS[status], className)} {...props}>
      {label ?? STATUS_LABELS[status]}
    </span>
  );
}
