import * as React from 'react';
import type { RequirementCategory } from '@/types';
import { cn } from '@/lib/utils';

export const CATEGORY_NAMES: Record<RequirementCategory, string> = {
  major_required: '전공핵심',
  major_compulsory: '전공필수',
  major_elective: '전공선택',
  general_required: '교양필수',
  general_elective: '교양선택',
  teaching: '교직',
  free_elective: '자유선택',
};

export const CATEGORY_DOT_CLASS: Record<RequirementCategory, string> = {
  major_required: 'bg-cat-major-required',
  major_compulsory: 'bg-cat-major-compulsory',
  major_elective: 'bg-cat-major-elective',
  general_required: 'bg-cat-general-required',
  general_elective: 'bg-cat-general-elective',
  teaching: 'bg-cat-teaching',
  free_elective: 'bg-cat-free-elective',
};

const NAME_TO_CATEGORY = Object.fromEntries(
  Object.entries(CATEGORY_NAMES).map(([key, name]) => [name, key])
) as Record<string, RequirementCategory>;

/** 카테고리 키('major_required') 또는 한글 이름('전공핵심')을 키로 정규화. 모르면 자유선택. */
export function resolveCategory(category?: RequirementCategory | string | null): RequirementCategory {
  if (!category) return 'free_elective';
  if (category in CATEGORY_DOT_CLASS) return category as RequirementCategory;
  return NAME_TO_CATEGORY[category] ?? 'free_elective';
}

export interface CategoryDotProps {
  category?: RequirementCategory | string | null;
  className?: string;
}

/** 6px 카테고리 점 (장식용, aria-hidden). 의미는 옆 글자로 전달한다. */
export function CategoryDot({ category, className }: CategoryDotProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block h-1.5 w-1.5 shrink-0 rounded-full',
        CATEGORY_DOT_CLASS[resolveCategory(category)],
        className
      )}
    />
  );
}

export interface CategoryLabelProps extends CategoryDotProps {
  /** 카테고리 이름 뒤에 붙는 내용 — 예: "CSE2008" → "전공핵심 · CSE2008" */
  suffix?: React.ReactNode;
  /** 이름 대신 표시할 내용 */
  children?: React.ReactNode;
}

/** 점 + 카테고리 이름 (Label 12/16 Ink2) */
export function CategoryLabel({ category, suffix, children, className }: CategoryLabelProps) {
  const key = resolveCategory(category);
  return (
    <span className={cn('inline-flex items-center gap-[5px] text-[12px] leading-4 text-ink-2', className)}>
      <CategoryDot category={key} />
      <span className="truncate">
        {children ?? CATEGORY_NAMES[key]}
        {suffix != null && <> · {suffix}</>}
      </span>
    </span>
  );
}
