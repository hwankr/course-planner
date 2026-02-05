'use client';

import { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Card } from '@/components/ui';
import { CourseCard } from './CourseCard';

interface SemesterColumnProps {
  semester: {
    year: number;
    term: 'spring' | 'fall';
    courses: Array<{
      id: string;
      code: string;
      name: string;
      credits: number;
      category?: string;
      status: 'planned' | 'enrolled' | 'completed' | 'failed';
    }>;
  };
  onRemoveCourse: (courseId: string) => void;
  isFocused?: boolean;
  onFocus?: () => void;
  compact?: boolean;
}

export function SemesterColumn({ semester, onRemoveCourse, isFocused = false, onFocus, compact = false }: SemesterColumnProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const MAX_VISIBLE = 4;
  const visibleCourses = compact && !isExpanded
    ? semester.courses.slice(0, MAX_VISIBLE)
    : semester.courses;
  const hiddenCount = semester.courses.length - MAX_VISIBLE;
  const droppableId = `semester-${semester.year}-${semester.term}`;
  const termLabel = semester.term === 'spring' ? '1학기' : '2학기';
  const totalCredits = semester.courses.reduce((sum, course) => sum + course.credits, 0);

  return (
    <Card className={`flex flex-col ${compact ? 'min-h-[180px]' : 'h-full min-h-[400px]'} ${isFocused ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}>
      {/* Header */}
      <div
        className={`${compact ? 'p-2' : 'p-4'} border-b cursor-pointer transition-colors ${isFocused ? 'bg-blue-50' : 'bg-gray-50'}`}
        onClick={onFocus}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`${compact ? 'text-sm' : 'text-lg'} font-semibold text-gray-800`}>
              {semester.year}년 {termLabel}
            </h3>
            <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-500 mt-1`}>
              총 {totalCredits}학점
            </p>
          </div>
          {isFocused && (
            <span className="text-xs px-2 py-1 bg-blue-500 text-white rounded-full font-medium">
              Focus
            </span>
          )}
        </div>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex-1 ${compact ? 'p-2' : 'p-4'} transition-colors
              ${snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : ''}
            `}
          >
            {semester.courses.length === 0 ? (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-400`}>
                  {isFocused ? '카탈로그에서 + 버튼으로 과목을 추가하세요' : '과목을 드래그하세요'}
                </p>
              </div>
            ) : (
              <div className={`transition-all duration-200 ${compact && !isExpanded ? 'max-h-[280px] overflow-hidden' : ''}`}>
                {visibleCourses.map((course, index) => (
                  <Draggable key={course.id} draggableId={course.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={snapshot.isDragging ? 'opacity-50' : ''}
                      >
                        <CourseCard
                          course={course}
                          index={index}
                          compact={compact}
                          onRemove={() => onRemoveCourse(course.id)}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {compact && !isExpanded && hiddenCount > 0 && (
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="w-full text-xs text-blue-500 hover:text-blue-700 py-1 text-center"
                  >
                    +{hiddenCount}개 더 보기
                  </button>
                )}
                {compact && isExpanded && semester.courses.length > MAX_VISIBLE && (
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="w-full text-xs text-gray-400 hover:text-gray-600 py-1 text-center"
                  >
                    접기
                  </button>
                )}
              </div>
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </Card>
  );
}
