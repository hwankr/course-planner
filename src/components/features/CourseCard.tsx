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
    status?: 'planned' | 'enrolled' | 'completed' | 'failed';
  };
  index?: number;        // Optional: only needed in SemesterColumn
  onRemove?: () => void; // Optional: only shown in SemesterColumn
  isDragDisabled?: boolean; // Optional: for catalog items already in plan
}

const statusColors = {
  planned: 'bg-blue-50 border-blue-200',
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

export function CourseCard({ course, index, onRemove, isDragDisabled }: CourseCardProps) {
  // Normalize ID - handle both _id (from API) and id (from plan)
  const courseId = course.id || course._id?.toString() || '';

  // Default status to 'planned' if not provided (for catalog view)
  const status = course.status || 'planned';

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
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-700">
              {course.code}
            </span>
            {course.status && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white border">
                {statusLabels[status]}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 truncate">
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
