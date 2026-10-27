'use client';

import { useEffect, useRef, useCallback } from 'react';
import { ReadOnlySemesterColumn } from './ReadOnlySemesterColumn';
import { useAnonymousPlanDetail } from '@/hooks/useStatistics';
import { useDialogFocus } from './useDialogFocus';
import { Button } from '@/components/ui';
import { X, AlertCircle, Loader2, Info } from 'lucide-react';

interface AnonymousPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  anonymousId: string | null;
  departmentId?: string;
  planNumber: number;
}

export function AnonymousPlanModal({ isOpen, onClose, anonymousId, departmentId, planNumber }: AnonymousPlanModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  useDialogFocus(modalRef, isOpen, { initialFocus: 'container' });
  const { data, isLoading, isError, error, refetch, isFetching } = useAnonymousPlanDetail(isOpen ? anonymousId : null, departmentId);
  const isNotFound = isError && error?.status === 404;

  // ESC key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // Auto-close on 404
  useEffect(() => {
    if (isNotFound) {
      const timer = setTimeout(onClose, 2000);
      return () => clearTimeout(timer);
    }
  }, [isNotFound, onClose]);

  if (!isOpen) return null;

  // Group semesters by year
  const semestersByYear = data?.semesters.reduce<Record<number, typeof data.semesters>>((acc, sem) => {
    if (!acc[sem.year]) acc[sem.year] = [];
    acc[sem.year].push(sem);
    return acc;
  }, {}) || {};

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="anonymous-plan-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-none border border-line-2 bg-white shadow-float outline-none"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 pt-5 pb-4">
          <div className="flex flex-col gap-1">
            <h2 id="anonymous-plan-title" className="m-0 text-[18px] leading-[26px] font-bold tracking-[-0.02em] text-ink">
              계획 {planNumber}
            </h2>
            {data && (
              <p className="m-0 text-[13px] leading-[18px] tabular-nums text-ink-2">
                총 {data.totalCredits}학점 · {data.semesters.reduce((sum, s) => sum + s.courses.length, 0)}과목
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mt-1.5 -mr-3 inline-flex h-11 w-11 shrink-0 items-center justify-center text-ink-2 transition-colors duration-150 ease-out hover:text-ink"
            aria-label="닫기"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pt-2 pb-6">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-ink-2">
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              계획을 불러오는 중...
            </div>
          )}

          {isError && (
            <div role="alert" className="flex flex-col items-center gap-1 py-16 text-center">
              <AlertCircle aria-hidden="true" className="mb-2 h-6 w-6 text-negative" />
              <p className="m-0 text-[15px] font-semibold text-ink">
                {isNotFound ? '이 계획 정보가 갱신되었습니다.' : '수강 계획을 불러오지 못했습니다.'}
              </p>
              {isNotFound ? (
                <p className="m-0 text-[13px] leading-[18px] text-ink-2">목록을 새로고침합니다...</p>
              ) : (
                <Button variant="textPrimary" onClick={() => refetch()} disabled={isFetching}>다시 시도</Button>
              )}
            </div>
          )}

          {data && (
            <div className="flex flex-col gap-9">
              {Object.entries(semestersByYear)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([year, semesters]) => (
                  <section key={year} className="flex flex-col gap-2">
                    <h3 className="m-0 pt-4 text-[18px] leading-[26px] font-bold tracking-[-0.02em] text-ink">{year}학년</h3>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-x-10 gap-y-6">
                      {semesters
                        .sort((a) => (a.term === 'spring' ? -1 : 1))
                        .map((sem) => (
                          <ReadOnlySemesterColumn
                            key={`${sem.year}-${sem.term}`}
                            semester={sem}
                          />
                        ))}
                    </div>
                  </section>
                ))}
            </div>
          )}
        </div>

        {/* Footer - Privacy Notice */}
        <div className="flex items-start gap-1.5 border-t border-line px-6 py-3 text-[12px] leading-4 text-ink-2">
          <Info aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0" />
          <p className="m-0">이 계획은 익명으로 공유되며, 작성자의 개인정보는 포함되지 않습니다.</p>
        </div>
      </div>
    </div>
  );
}
