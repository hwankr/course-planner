'use client';

import { useEffect, useRef, useCallback } from 'react';
import { ReadOnlySemesterColumn } from './ReadOnlySemesterColumn';
import { useAnonymousPlanDetail } from '@/hooks/useStatistics';
import { X, AlertCircle, Loader2, Info } from 'lucide-react';

interface AnonymousPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  anonymousId: string | null;
  departmentId?: string;
}

export function AnonymousPlanModal({ isOpen, onClose, anonymousId, departmentId }: AnonymousPlanModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, isError } = useAnonymousPlanDetail(isOpen ? anonymousId : null, departmentId);

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
      // Focus the modal
      modalRef.current?.focus();
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // Auto-close on 404
  useEffect(() => {
    if (isError) {
      const timer = setTimeout(onClose, 2000);
      return () => clearTimeout(timer);
    }
  }, [isError, onClose]);

  if (!isOpen) return null;

  // Group semesters by year
  const semestersByYear = data?.semesters.reduce<Record<number, typeof data.semesters>>((acc, sem) => {
    if (!acc[sem.year]) acc[sem.year] = [];
    acc[sem.year].push(sem);
    return acc;
  }, {}) || {};

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="익명 수강계획"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">익명 수강계획</h2>
            {data && (
              <p className="text-sm text-gray-500 mt-0.5">
                총 {data.totalCredits}학점 · {data.semesters.reduce((sum, s) => sum + s.courses.length, 0)}과목
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
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <p className="text-sm">계획을 불러오는 중...</p>
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center justify-center py-16 text-amber-600">
              <AlertCircle className="w-8 h-8 mb-3" />
              <p className="text-sm font-medium">이 계획 정보가 갱신되었습니다.</p>
              <p className="text-xs text-gray-400 mt-1">목록을 새로고침합니다...</p>
            </div>
          )}

          {data && (
            <div className="space-y-6">
              {Object.entries(semestersByYear)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([year, semesters]) => (
                  <div key={year}>
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">{year}학년</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {semesters
                        .sort((a) => (a.term === 'spring' ? -1 : 1))
                        .map((sem) => (
                          <ReadOnlySemesterColumn
                            key={`${sem.year}-${sem.term}`}
                            semester={sem}
                          />
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Footer - Privacy Notice */}
        <div className="px-6 py-3 border-t bg-gray-50">
          <div className="flex items-start gap-2 text-xs text-gray-400">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <p>이 계획은 익명으로 공유되며, 작성자의 개인정보는 포함되지 않습니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
