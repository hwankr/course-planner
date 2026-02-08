'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';

interface ReadOnlySemesterColumnProps {
  semester: {
    year: number;
    term: string;
    courses: Array<{
      code: string;
      name: string;
      credits: number;
      category?: string;
    }>;
  };
  compact?: boolean;
}

const categoryLabels: Record<string, string> = {
  major_required: '전핵',
  major_compulsory: '전필',
  major_elective: '전선',
  general_required: '교필',
  general_elective: '교선',
  teaching: '교직',
  free_elective: '자선',
};

const categoryColors: Record<string, string> = {
  major_required: 'bg-red-100 text-red-700',
  major_compulsory: 'bg-rose-100 text-rose-700',
  major_elective: 'bg-orange-100 text-orange-700',
  general_required: 'bg-blue-100 text-blue-700',
  general_elective: 'bg-green-100 text-green-700',
  teaching: 'bg-violet-100 text-violet-700',
  free_elective: 'bg-gray-100 text-gray-600',
};

export function ReadOnlySemesterColumn({ semester, compact = false }: ReadOnlySemesterColumnProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const termLabel = semester.term === 'spring' ? '1학기' : '2학기';
  const totalCredits = semester.courses.reduce((sum, c) => sum + c.credits, 0);

  const categoryBreakdown = (() => {
    const counts: Record<string, number> = {};
    for (const course of semester.courses) {
      const cat = course.category || 'free_elective';
      counts[cat] = (counts[cat] || 0) + course.credits;
    }
    return ['major_required', 'major_compulsory', 'major_elective', 'general_required', 'general_elective', 'teaching', 'free_elective']
      .filter(cat => counts[cat])
      .map(cat => ({ key: cat, label: categoryLabels[cat], credits: counts[cat] }));
  })();

  return (
    <Card className="flex flex-col">
      {/* Header */}
      <div
        className={`${compact ? 'p-2' : 'p-3'} border-b bg-gray-50 cursor-pointer`}
        onClick={() => compact && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div>
            <h4 className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-gray-800`}>
              {semester.year}학년 {termLabel}
            </h4>
            <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-500 mt-0.5`}>
              {totalCredits}학점 · {semester.courses.length}과목
              {categoryBreakdown.length > 0 && (
                <span className="text-gray-400 ml-1">
                  ({categoryBreakdown.map(c => `${c.label}${c.credits}`).join(' · ')})
                </span>
              )}
            </p>
          </div>
          {compact && (
            <button className="text-gray-400 text-xs">
              {isExpanded ? '접기' : '펼치기'}
            </button>
          )}
        </div>
      </div>

      {/* Course List */}
      {isExpanded && (
        <div className={`${compact ? 'p-2' : 'p-3'} space-y-1.5`}>
          {semester.courses.map((course, idx) => {
            const cat = course.category || 'free_elective';
            return (
              <div
                key={`${course.code}-${idx}`}
                className="flex items-center gap-2 p-2 rounded-md bg-white border border-gray-100"
              >
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${categoryColors[cat] || categoryColors.free_elective}`}>
                  {categoryLabels[cat] || '자선'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{course.name}</p>
                  <p className="text-xs text-gray-400">{course.code}</p>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">{course.credits}학점</span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
