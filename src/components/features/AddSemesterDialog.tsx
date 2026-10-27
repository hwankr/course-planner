'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { Term } from '@/types';
import { useDialogFocus } from './useDialogFocus';

interface AddSemesterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (year: number, term: Term) => void;
  existingSemesters: Array<{ year: number; term: Term }>;
  isLoading?: boolean;
}

export function AddSemesterDialog({
  isOpen,
  onClose,
  onAdd,
  existingSemesters,
  isLoading = false,
}: AddSemesterDialogProps) {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [term, setTerm] = useState<Term>('spring');

  // Smart defaults algorithm
  const calculateDefaults = useCallback(() => {
    if (existingSemesters.length === 0) {
      return {
        year: 1,
        term: 'spring' as Term,
      };
    }

    // Sort by year, then by term (spring < fall)
    const sorted = [...existingSemesters].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.term === 'spring' ? -1 : 1;
    });

    const last = sorted[sorted.length - 1];

    if (last.term === 'spring') {
      return { year: last.year, term: 'fall' as Term };
    } else {
      return { year: Math.min(last.year + 1, 6), term: 'spring' as Term };
    }
  }, [existingSemesters]);

  // Apply defaults once per opening; background refetches must not reset a selection.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      const defaults = calculateDefaults();
      // Use queueMicrotask to avoid synchronous setState in effect
      queueMicrotask(() => {
        setYear(defaults.year);
        setTerm(defaults.term);
      });
    }
    wasOpen.current = isOpen;
  }, [isOpen, calculateDefaults]);

  // Check for duplicates
  const isDuplicate = existingSemesters.some(
    (s) => s.year === year && s.term === term
  );

  // 포커스 관리 + Escape 닫기. Escape는 document 단계에서 먼저 처리해 planner의 window Escape(학기 선택 해제)보다 앞선다.
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, isOpen, { onEscape: onClose });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDuplicate && !isLoading) {
      onAdd(year, term);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const optionClass = (selected: boolean) =>
    cn(
      'h-11 border-b-2 px-0.5 text-[15px] transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-40',
      selected ? 'border-primary font-semibold text-primary' : 'border-transparent font-medium text-ink-2 hover:text-ink'
    );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-semester-title"
        className="w-full max-w-md rounded-none border border-line-2 bg-white px-6 pt-6 pb-5 shadow-float"
      >
        <h2 id="add-semester-title" className="m-0 text-[18px] leading-[26px] font-bold tracking-[-0.02em] text-ink">
          학기 추가
        </h2>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-6">
          {/* Grade Year Selector */}
          <fieldset className="m-0 border-0 p-0">
            <legend className="mb-1 p-0 text-[13px] leading-[18px] font-semibold text-ink-2">학년</legend>
            <div className="flex gap-3 border-b border-line sm:gap-5">
              {[1, 2, 3, 4, 5, 6].map((grade) => (
                <button
                  key={grade}
                  type="button"
                  onClick={() => setYear(grade)}
                  disabled={isLoading}
                  aria-pressed={year === grade}
                  className={optionClass(year === grade)}
                >
                  {grade}학년
                </button>
              ))}
            </div>
          </fieldset>

          {/* Term Selector */}
          <fieldset className="m-0 border-0 p-0">
            <legend className="mb-1 p-0 text-[13px] leading-[18px] font-semibold text-ink-2">학기</legend>
            <div className="flex gap-3 border-b border-line sm:gap-5">
              {(['spring', 'fall'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTerm(t)}
                  disabled={isLoading}
                  aria-pressed={term === t}
                  className={optionClass(term === t)}
                >
                  {t === 'spring' ? '1학기' : '2학기'}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Duplicate Warning */}
          {isDuplicate && (
            <p role="alert" className="m-0 text-[13px] leading-[18px] font-medium text-negative">
              {year}학년 {term === 'spring' ? '1학기' : '2학기'}는 이미 추가되어 있습니다.
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="text"
              onClick={onClose}
              disabled={isLoading}
              className="h-12"
            >
              취소
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={isDuplicate || isLoading}
              isLoading={isLoading}
              className="min-w-[120px]"
            >
              추가
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
