'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AnonymousPlanModal } from './AnonymousPlanModal';
import { useAnonymousPlans } from '@/hooks/useStatistics';
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
      modalRef.current?.focus();
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

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPlansPage(1);
      setSelectedPlanId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget && selectedPlanId === null) onClose();
        }}
        role="dialog"
        aria-modal="true"
        aria-label="익명 수강계획 전체 보기"
      >
        <div
          ref={modalRef}
          tabIndex={-1}
          className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col outline-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
            <div>
              <h2 className="text-lg font-bold text-gray-900">익명 수강계획 전체 보기</h2>
              {plansData && (
                <p className="text-sm text-gray-500 mt-0.5">
                  총 {plansData.total}개의 수강계획
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              aria-label="닫기"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {plansLoading && plansPage === 1 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#3069B3]" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {plansData?.plans.map((plan, index) => {
                    const label = String.fromCharCode(65 + ((plansPage - 1) * 9 + index));
                    return (
                      <button
                        key={plan.anonymousId}
                        onClick={() => setSelectedPlanId(plan.anonymousId)}
                        className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#3069B3] hover:shadow-md transition-all text-left"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#153974] to-[#3069B3] text-white flex items-center justify-center font-bold text-sm">
                            {label}
                          </div>
                          <span className="font-semibold text-gray-900">계획 {label}</span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>{plan.semesterCount}개 학기</p>
                          <p>{plan.totalCourses}개 과목 · {plan.totalCredits}학점</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {plansData && plansData.plans.length > 0 && (
                  <p className="text-xs text-gray-400 mt-4 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    모든 계획은 익명으로 표시됩니다
                  </p>
                )}

                {plansData && plansData.total > plansPage * plansData.limit && (
                  <div className="text-center mt-4">
                    <button
                      onClick={() => setPlansPage((p) => p + 1)}
                      disabled={plansLoading}
                      className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[#3069B3] text-[#3069B3] rounded-lg hover:bg-[#3069B3] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {plansLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          로딩 중...
                        </>
                      ) : (
                        <>
                          더 보기
                          <ChevronRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                )}

                {plansData?.plans.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <p className="font-medium mb-1">아직 공개된 수강 계획이 없습니다</p>
                    <p className="text-sm">학과 학생들이 수강 계획을 작성하면 이곳에 익명으로 표시됩니다</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t bg-gray-50">
            <div className="flex items-start gap-2 text-xs text-gray-400">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <p>이 계획은 익명으로 공유되며, 작성자의 개인정보는 포함되지 않습니다.</p>
            </div>
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
