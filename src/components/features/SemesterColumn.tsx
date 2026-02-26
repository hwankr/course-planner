'use client';

import { useState } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui';
import { CourseCard } from './CourseCard';
import { usePlanStore } from '@/stores/planStore';

interface SemesterColumnProps {
  semester: {
    year: number;
    term: 'spring' | 'fall';
    courses: Array<{
      id: string;
      code: string;
      name: string;
      credits: number;
      category?: 'major_required' | 'major_compulsory' | 'major_elective' | 'general_required' | 'general_elective' | 'free_elective' | 'teaching';
      status: 'planned' | 'enrolled' | 'completed' | 'failed';
    }>;
  };
  onRemoveCourse: (courseId: string) => void;
  onDelete?: () => void;
  onClear?: () => void;
  isFocused?: boolean;
  onFocus?: () => void;
  compact?: boolean;
  onStatusChange?: (courseId: string, newStatus: 'planned' | 'enrolled' | 'completed' | 'failed') => void;
}

function DraggableSemesterCourse({
  course,
  index,
  compact,
  containerId,
  onRemove,
  onStatusChange,
}: {
  course: SemesterColumnProps['semester']['courses'][number];
  index: number;
  compact: boolean;
  containerId: string;
  onRemove: () => void;
  onStatusChange?: (courseId: string, newStatus: 'planned' | 'enrolled' | 'completed' | 'failed') => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: course.id,
    data: { containerId, course, type: 'semester' },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={isDragging ? 'opacity-50' : ''}
      style={{ transform: CSS.Translate.toString(transform), touchAction: 'none' }}
    >
      <CourseCard
        course={course}
        index={index}
        compact={compact}
        onRemove={onRemove}
        onStatusChange={onStatusChange}
      />
    </div>
  );
}

export function SemesterColumn({ semester, onRemoveCourse, onDelete, onClear, isFocused = false, onFocus, compact = false, onStatusChange }: SemesterColumnProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isExporting = usePlanStore((s) => s.isExporting);
  const MAX_VISIBLE = 4;
  const visibleCourses = compact && !isExpanded && !isExporting
    ? semester.courses.slice(0, MAX_VISIBLE)
    : semester.courses;
  const hiddenCount = semester.courses.length - MAX_VISIBLE;
  const droppableId = `semester-${semester.year}-${semester.term}`;
  const termLabel = semester.term === 'spring' ? '1학기' : '2학기';
  const totalCredits = semester.courses.reduce((sum, course) => sum + course.credits, 0);

  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  const categoryBreakdown = (() => {
    const counts: Record<string, number> = {};
    const labels: Record<string, string> = {
      major_required: '전핵',
      major_compulsory: '전필',
      major_elective: '전선',
      general_required: '교필',
      general_elective: '교선',
      teaching: '교직',
      free_elective: '자선',
    };
    for (const course of semester.courses) {
      const cat = course.category || 'free_elective';
      counts[cat] = (counts[cat] || 0) + course.credits;
    }
    return ['major_required', 'major_compulsory', 'major_elective', 'general_required', 'general_elective', 'teaching', 'free_elective']
      .filter(cat => counts[cat])
      .map(cat => ({ key: cat, label: labels[cat], credits: counts[cat] }));
  })();

  return (
    <Card
      ref={setNodeRef}
      className={`flex flex-col ${compact ? 'min-h-[180px]' : 'h-full min-h-[400px]'} ${isFocused && !isExporting ? 'ring-2 ring-[#00AACA] border-[#00AACA]' : ''} ${isOver ? 'ring-2 ring-[#00AACA]/50 bg-[#00AACA]/5' : ''}`}
    >
      {/* Header */}
      <div
        className={`${compact ? 'p-2' : 'p-4'} border-b cursor-pointer transition-colors ${isFocused ? 'bg-[#153974]/5' : 'bg-gray-50'}`}
        onClick={onFocus}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`${compact ? 'text-sm' : 'text-lg'} font-semibold text-gray-800`}>
              {semester.year}학년 {termLabel}
            </h3>
            <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-500 mt-1`}>
              {totalCredits}학점
              {categoryBreakdown.length > 0 && (
                <span className="text-gray-400 ml-1">
                  ({categoryBreakdown.map(c => `${c.label}${c.credits}`).join(' · ')})
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onClear && semester.courses.length > 0 && !isExporting && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`이 학기의 모든 과목(${semester.courses.length}개)을 제거하시겠습니까?`)) {
                    onClear();
                  }
                }}
                className="p-1 hover:bg-amber-100 rounded-full transition-colors"
                aria-label="학기 초기화"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 hover:text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            {onDelete && !isExporting && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (semester.courses.length > 0) {
                    if (window.confirm(`이 학기에 ${semester.courses.length}개의 과목이 있습니다. 정말 삭제하시겠습니까?`)) {
                      onDelete();
                    }
                  } else {
                    onDelete();
                  }
                }}
                className="p-1 hover:bg-red-100 rounded-full transition-colors"
                aria-label="학기 삭제"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 hover:text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            {isFocused && (
              <span className="text-xs px-2 py-1 bg-[#153974] text-white rounded-full font-medium">
                Focus
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Droppable Area */}
      <div
        className={`flex-1 ${compact ? 'p-2' : 'p-4'} transition-colors`}
      >
        {semester.courses.length === 0 ? (
          <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
            <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-400`}>
              {isFocused ? '과목 리스트에서 + 버튼으로 과목을 추가하세요' : '과목을 드래그하세요'}
            </p>
          </div>
        ) : (
          <div className={`transition-all duration-200 ${compact && !isExpanded && !isExporting ? 'max-h-[280px] overflow-hidden' : ''}`}>
            {visibleCourses.map((course, index) => (
              <DraggableSemesterCourse
                key={course.id}
                course={course}
                index={index}
                compact={compact}
                containerId={droppableId}
                onRemove={() => onRemoveCourse(course.id)}
                onStatusChange={onStatusChange}
              />
            ))}
            {compact && !isExpanded && hiddenCount > 0 && !isExporting && (
              <button
                onClick={() => setIsExpanded(true)}
                className="w-full text-xs text-[#3069B3] hover:text-[#153974] py-1 text-center"
              >
                +{hiddenCount}개 더 보기
              </button>
            )}
            {compact && isExpanded && semester.courses.length > MAX_VISIBLE && !isExporting && (
              <button
                onClick={() => setIsExpanded(false)}
                className="w-full text-xs text-gray-400 hover:text-gray-600 py-1 text-center"
              >
                접기
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
