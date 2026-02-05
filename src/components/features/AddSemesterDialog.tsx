'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import type { Term } from '@/types';

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
      return { year: Math.min(last.year + 1, 5), term: 'spring' as Term };
    }
  }, [existingSemesters]);

  // Set defaults when dialog opens
  useEffect(() => {
    if (isOpen) {
      const defaults = calculateDefaults();
      // Use queueMicrotask to avoid synchronous setState in effect
      queueMicrotask(() => {
        setYear(defaults.year);
        setTerm(defaults.term);
      });
    }
  }, [isOpen, calculateDefaults]);

  // Check for duplicates
  const isDuplicate = existingSemesters.some(
    (s) => s.year === year && s.term === term
  );

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <Card className="w-full max-w-md bg-white">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-semibold mb-6">학기 추가</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Grade Year Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                학년
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setYear(grade)}
                    disabled={isLoading}
                    className={`
                      py-2.5 px-2 rounded-md border-2 transition-colors font-medium text-sm whitespace-nowrap
                      ${
                        year === grade
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }
                      ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    {grade}학년
                  </button>
                ))}
              </div>
            </div>

            {/* Term Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                학기
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTerm('spring')}
                  disabled={isLoading}
                  className={`
                    py-3 px-4 rounded-md border-2 transition-colors font-medium
                    ${
                      term === 'spring'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  1학기
                </button>
                <button
                  type="button"
                  onClick={() => setTerm('fall')}
                  disabled={isLoading}
                  className={`
                    py-3 px-4 rounded-md border-2 transition-colors font-medium
                    ${
                      term === 'fall'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  2학기
                </button>
              </div>
            </div>

            {/* Duplicate Warning */}
            {isDuplicate && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200">
                <p className="text-sm text-red-700 font-medium">
                  {year}학년 {term === 'spring' ? '1학기' : '2학기'}는 이미 추가되어 있습니다.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={isDuplicate || isLoading}
                isLoading={isLoading}
                className="flex-1"
              >
                추가
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1"
              >
                취소
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
