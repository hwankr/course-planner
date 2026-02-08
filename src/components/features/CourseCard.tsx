'use client';

import { Card } from '@/components/ui';
import type { Types } from 'mongoose';

interface CourseCardProps {
  course: {
    _id?: Types.ObjectId | string;  // From API (catalog)
    id?: string;                     // From plan (semester)
    code: string;
    name: string;
    credits: number;
    category?: 'major_required' | 'major_compulsory' | 'major_elective' | 'general_required' | 'general_elective' | 'free_elective' | 'teaching';
    status?: 'planned' | 'enrolled' | 'completed' | 'failed';
  };
  index?: number;        // Optional: only needed in SemesterColumn
  onRemove?: () => void; // Optional: only shown in SemesterColumn
  onStatusChange?: (courseId: string, newStatus: 'planned' | 'enrolled' | 'completed' | 'failed') => void; // Optional: for status updates
  isDragDisabled?: boolean; // Optional: for catalog items already in plan
  compact?: boolean;     // Optional: for compact display mode
  departmentLabel?: string;  // e.g. "복수전공", "부전공"
}

const statusColors = {
  planned: 'bg-[#153974]/5 border-[#153974]/20',
  enrolled: 'bg-green-50 border-green-200',
  completed: 'bg-gray-50 border-gray-200',
  failed: 'bg-red-50 border-red-200',
};

const statusLabels = {
  planned: '계획',
  enrolled: '수강중',
  completed: '완료',
  failed: '재수강',
};

const categoryLabels: Record<string, string> = {
  major_required: '전공핵심',
  major_compulsory: '전공필수',
  major_elective: '전공선택',
  general_required: '교양필수',
  general_elective: '교양선택',
  teaching: '교직',
  free_elective: '자유선택',
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

const statusPillColors = {
  planned: 'bg-blue-100 text-blue-700',
  enrolled: 'bg-green-100 text-green-700',
  completed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
};

const statusPillLabels = {
  planned: '예정',
  enrolled: '수강중',
  completed: '이수',
  failed: '재수강',
};

// Module-level variable to track if hint has been shown
let statusHintShown = false;

// Helper to toggle status: planned <-> completed (2-step toggle)
function getNextStatus(current: 'planned' | 'enrolled' | 'completed' | 'failed'): 'planned' | 'enrolled' | 'completed' | 'failed' {
  // Toggle between planned and completed; any other status → completed
  return current === 'completed' ? 'planned' : 'completed';
}

export function CourseCard({ course, onRemove, onStatusChange, isDragDisabled, compact = false, departmentLabel }: CourseCardProps) {

  // Default status to 'planned' if not provided (for catalog view)
  const status = course.status || 'planned';

  // Get course ID (from either _id or id field)
  const courseId = (course.id || course._id?.toString()) ?? '';

  // Handle status click
  const handleStatusClick = (e: React.MouseEvent) => {
    statusHintShown = true;
    e.stopPropagation();
    if (onStatusChange && courseId) {
      const nextStatus = getNextStatus(status);
      onStatusChange(courseId, nextStatus);
    }
  };

  // Compact mode: single-line condensed view
  if (compact) {
    const showPulse = !statusHintShown && status === 'planned' && onStatusChange;

    return (
      <Card
        className={`
          mb-1 px-2 py-1.5 transition-shadow
          ${statusColors[status]}
          ${isDragDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-move'}
          shadow-sm hover:shadow-md
        `}
      >
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {onStatusChange && (
              <button
                onClick={handleStatusClick}
                className={`px-1.5 py-0.5 rounded text-[9px] font-medium flex-shrink-0 cursor-pointer transition-all hover:ring-2 hover:ring-offset-1 hover:ring-gray-300 ${statusPillColors[status]} ${showPulse ? 'animate-pulse ring-2 ring-blue-300/50' : ''}`}
                aria-label={`상태 변경: ${statusLabels[status]}`}
                title="클릭하여 상태 변경: 예정 ↔ 이수"
              >
                {statusPillLabels[status]}
              </button>
            )}
            {course.category && categoryLabels[course.category] && (
              <span className={`text-[10px] px-1 py-0.5 rounded font-medium whitespace-nowrap ${categoryColors[course.category] || 'bg-gray-100 text-gray-600'}`}>
                {categoryLabels[course.category]}
              </span>
            )}
            {departmentLabel && (
              <span className={`text-[10px] px-1 py-0.5 rounded font-medium whitespace-nowrap ${
                departmentLabel === '복수전공'
                  ? 'bg-purple-100 text-purple-700'
                  : departmentLabel === '부전공'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-600'
              }`}>
                {departmentLabel}
              </span>
            )}
            <span className="text-xs font-medium text-gray-800 truncate">
              {course.name}
            </span>
            <span className="text-[10px] text-gray-500 whitespace-nowrap">
              {course.credits}학점
            </span>
          </div>
          {onRemove && !isDragDisabled && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-0.5 hover:bg-white rounded-full transition-colors flex-shrink-0"
              aria-label="과목 제거"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3 h-3 text-gray-400 hover:text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </Card>
    );
  }

  // Default mode: full card view
  return (
    <Card
      className={`
        mb-2 p-3 transition-shadow
        ${statusColors[status]}
        ${isDragDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-move'}
        shadow-sm hover:shadow-md
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            {course.category && categoryLabels[course.category] && (
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${categoryColors[course.category] || 'bg-gray-100 text-gray-600'}`}>
                {categoryLabels[course.category]}
              </span>
            )}
            {departmentLabel && (
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                departmentLabel === '복수전공'
                  ? 'bg-purple-100 text-purple-700'
                  : departmentLabel === '부전공'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-600'
              }`}>
                {departmentLabel}
              </span>
            )}
            {course.status && onStatusChange ? (
              <button
                onClick={handleStatusClick}
                className="text-xs px-2 py-0.5 rounded-full bg-white border hover:bg-gray-50 hover:border-gray-400 transition-colors cursor-pointer"
                aria-label={`상태 변경: ${statusLabels[status]}`}
              >
                {statusLabels[status]}
              </button>
            ) : course.status ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white border">
                {statusLabels[status]}
              </span>
            ) : null}
          </div>
          <p className="text-sm font-medium text-gray-800 truncate">
            {course.name}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {course.credits}학점
          </p>
        </div>
        {onRemove && !isDragDisabled && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="ml-2 p-1 hover:bg-white rounded-full transition-colors"
            aria-label="과목 제거"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-gray-400 hover:text-red-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </Card>
  );
}
