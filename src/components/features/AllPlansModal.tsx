'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AnonymousPlanModal } from './AnonymousPlanModal';
import { useAnonymousPlans } from '@/hooks/useStatistics';
import { useDialogFocus } from './useDialogFocus';
import { X, Loader2, ChevronRight, Info } from 'lucide-react';

interface AllPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId?: string;
}

export function AllPlansModal({ isOpen, onClose, departmentId }: AllPlansModalProps) {
  const [plansPage, setPlansPage] = useState(1);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  useDialogFocus(modalRef, isOpen, { initialFocus: 'container' });

  const { data: plansData, isLoading: plansLoading } = useAnonymousPlans(
    departmentId, plansPage, 9, isOpen
  );

  // ESC key handler - CRITIC FIX #1: skip close when detail modal is open
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedPlanId === null) {
        onClose();
      }
    },
    [onClose, selectedPlanId]
  );

  // Main modal lifecycle - overflow control
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

  // CRITIC FIX #3: Re-assert overflow hidden when detail modal closes
  useEffect(() => {
    if (isOpen && selectedPlanId === null) {
      document.body.style.overflow = 'hidden';
    }
  }, [isOpen, selectedPlanId]);

  // Reset state when modal closes - use layout effect to avoid cascading renders
  useEffect(() => {
    if (!isOpen) {
      // Queue state updates to avoid synchronous setState in effect
      Promise.resolve().then(() => {
        setPlansPage(1);
        setSelectedPlanId(null);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget && selectedPlanId === null) onClose();
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="all-plans-title"
      >
        <div
          ref={modalRef}
          tabIndex={-1}
          className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-none border border-line-2 bg-white shadow-float outline-none"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-line px-6 pt-5 pb-4">
            <div className="flex flex-col gap-1">
              <h2 id="all-plans-title" className="m-0 text-[18px] leading-[26px] font-bold tracking-[-0.02em] text-ink">
                익명 수강계획 전체 보기
              </h2>
              {plansData && (
                <p className="m-0 text-[13px] leading-[18px] tabular-nums text-ink-2">
                  총 {plansData.total}개의 수강계획
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
          <div className="flex-1 overflow-y-auto px-6 pb-4">
            {plansLoading && plansPage === 1 ? (
              <div className="flex items-center justify-center gap-2 py-12 text-[13px] text-ink-2">
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                불러오는 중이에요
              </div>
            ) : (
              <>
                <ul className="m-0 list-none p-0">
                  {plansData?.plans.map((plan, index) => {
                    const label = String.fromCharCode(65 + ((plansPage - 1) * 9 + index));
                    return (
                      <li key={plan.anonymousId}>
                        <button
                          type="button"
                          onClick={() => setSelectedPlanId(plan.anonymousId)}
                          className="group flex min-h-14 w-full items-center gap-3 border-b border-line py-1.5 text-left"
                        >
                          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="text-[15px] leading-5 font-semibold text-ink transition-colors duration-150 ease-out group-hover:text-primary">
                              계획 {label}
                            </span>
                            <span className="text-[12px] leading-4 tabular-nums text-ink-2">
                              {plan.semesterCount}개 학기 · {plan.totalCourses}과목 · {plan.totalCredits}학점
                            </span>
                          </span>
                          <ChevronRight aria-hidden="true" className="h-[18px] w-[18px] shrink-0 text-placeholder" />
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {plansData && plansData.total > plansPage * plansData.limit && (
                  <button
                    type="button"
                    onClick={() => setPlansPage((p) => p + 1)}
                    disabled={plansLoading}
                    className="mt-2 inline-flex h-11 items-center gap-1.5 text-[14px] font-semibold text-primary transition-colors duration-150 ease-out hover:text-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {plansLoading ? (
                      <>
                        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                        로딩 중...
                      </>
                    ) : (
                      '더 보기'
                    )}
                  </button>
                )}

                {plansData?.plans.length === 0 && (
                  <div className="flex flex-col gap-1 py-12 text-center">
                    <p className="m-0 text-[15px] font-semibold text-ink">아직 공개된 수강 계획이 없습니다</p>
                    <p className="m-0 text-[13px] leading-[18px] text-ink-2">학과 학생들이 수강 계획을 작성하면 이곳에 익명으로 표시됩니다</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-start gap-1.5 border-t border-line px-6 py-3 text-[12px] leading-4 text-ink-2">
            <Info aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0" />
            <p className="m-0">모든 계획은 익명으로 표시되며, 작성자의 개인정보는 포함되지 않습니다.</p>
          </div>
        </div>
      </div>

      {/* Detail Modal - renders on top at z-50 */}
      {selectedPlanId && (
        <AnonymousPlanModal
          isOpen={true}
          anonymousId={selectedPlanId}
          departmentId={departmentId}
          onClose={() => setSelectedPlanId(null)}
        />
      )}
    </>
  );
}
