'use client';

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
      status: 'planned' | 'enrolled' | 'completed' | 'failed';
    }>;
  };
  onRemoveCourse: (courseId: string) => void;
}

export function SemesterColumn({ semester, onRemoveCourse }: SemesterColumnProps) {
  const droppableId = `semester-${semester.year}-${semester.term}`;
  const termLabel = semester.term === 'spring' ? '1학기' : '2학기';
  const totalCredits = semester.courses.reduce((sum, course) => sum + course.credits, 0);

  return (
    <Card className="flex flex-col h-full min-h-[400px]">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-800">
          {semester.year}년 {termLabel}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          총 {totalCredits}학점
        </p>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex-1 p-4 transition-colors
              ${snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : ''}
            `}
          >
            {semester.courses.length === 0 ? (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-sm text-gray-400">
                  과목을 여기에 드래그하세요
                </p>
              </div>
            ) : (
              semester.courses.map((course, index) => (
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
                        onRemove={() => onRemoveCourse(course.id)}
                      />
                    </div>
                  )}
                </Draggable>
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </Card>
  );
}
