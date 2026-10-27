'use client';

import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import type { AcademicEventCategory } from '@/types';

export interface EventFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  category: AcademicEventCategory;
  isHoliday: boolean;
}

interface EventFormDialogProps {
  isEditing: boolean;
  formData: EventFormData;
  onChange: (data: EventFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isPending: boolean;
  categoryLabels: Record<AcademicEventCategory, string>;
}

// 폼 입력은 밑줄 하나, 포커스 시 2px Primary + 라벨 Primary (Input underline 과 같은 규칙)
const FIELD_LABEL =
  'mb-1.5 block text-[13px] leading-[18px] font-semibold text-ink-2 transition-colors duration-150 group-focus-within:text-primary';
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const UNDERLINE_FIELD =
  'w-full rounded-none border-0 border-b border-line-3 bg-transparent px-0 text-[17px] font-medium text-ink focus:border-primary focus:shadow-[inset_0_-1px_0_var(--color-primary)] focus:outline-none focus-visible:outline-none transition-colors duration-150 ease-out';

/** 관리자용 일정 추가/수정 시트. 떠 있는 요소라 shadow-float 하나만 쓴다. */
export function EventFormDialog({
  isEditing,
  formData,
  onChange,
  onSubmit,
  onClose,
  isPending,
  categoryLabels,
}: EventFormDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const categoryId = useId();
  const holidayId = useId();

  const dialogRef = useRef<HTMLDivElement>(null);

  // 열릴 때 첫 입력으로 포커스, 닫힐 때 연 요소로 복귀
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLElement>('input, textarea, select')?.focus();
    return () => {
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);

  // Escape 로 닫고, Tab 은 시트 안에서만 순환
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const inside = dialogRef.current.contains(active);
      if (event.shiftKey && (active === first || !inside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !inside)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center md:p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-none border border-line-2 bg-white px-5 pt-4 pb-8 shadow-float md:px-8 md:pt-6"
      >
        <div className="flex items-center justify-between">
          <h2 id={titleId} className="m-0 text-[18px] leading-[26px] font-bold tracking-[-0.02em] text-ink">
            {isEditing ? '일정 수정' : '일정 추가'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-[8px] text-ink-2 transition-colors duration-150 hover:text-ink"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-6">
          <Input
            label="제목"
            value={formData.title}
            onChange={(e) => onChange({ ...formData, title: e.target.value })}
            required
          />

          <div className="group">
            <label htmlFor={descriptionId} className={FIELD_LABEL}>
              설명
            </label>
            <textarea
              id={descriptionId}
              value={formData.description}
              onChange={(e) => onChange({ ...formData, description: e.target.value })}
              rows={3}
              className={`${UNDERLINE_FIELD} resize-none py-2 text-[15px] leading-5`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="시작일"
              type="date"
              value={formData.startDate}
              onChange={(e) => onChange({ ...formData, startDate: e.target.value })}
              className="text-[15px]"
              required
            />
            <Input
              label="종료일"
              type="date"
              value={formData.endDate}
              onChange={(e) => onChange({ ...formData, endDate: e.target.value })}
              min={formData.startDate}
              className="text-[15px]"
            />
          </div>

          <div className="group">
            <label htmlFor={categoryId} className={FIELD_LABEL}>
              분류
            </label>
            <select
              id={categoryId}
              value={formData.category}
              onChange={(e) =>
                onChange({ ...formData, category: e.target.value as AcademicEventCategory })
              }
              className={`${UNDERLINE_FIELD} h-10 cursor-pointer text-[15px]`}
            >
              {(Object.keys(categoryLabels) as AcademicEventCategory[]).map((cat) => (
                <option key={cat} value={cat}>
                  {categoryLabels[cat]}
                </option>
              ))}
            </select>
          </div>

          <label htmlFor={holidayId} className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px] font-medium text-ink">
            <input
              type="checkbox"
              id={holidayId}
              checked={formData.isHoliday}
              onChange={(e) => onChange({ ...formData, isHoliday: e.target.checked })}
              className="h-[18px] w-[18px] cursor-pointer accent-primary"
            />
            공휴일로 표시
          </label>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="text" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? '저장 중...' : isEditing ? '수정' : '추가'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
