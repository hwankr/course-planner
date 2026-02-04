'use client';

import { useState, useEffect } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { useCourses } from '@/hooks/useCourses';
import { Input } from '@/components/ui/Input';
import { CourseCard } from './CourseCard';

interface CourseCatalogProps {
  planCourseIds: string[];  // IDs of courses already in the plan (to disable dragging)
}

export function CourseCatalog({ planCourseIds }: CourseCatalogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch courses with debounced search filter
  const { data: courses = [], isLoading, error } = useCourses({
    search: debouncedSearch || undefined,
  });

  // Filter courses locally for instant feedback while typing
  const filteredCourses = courses.filter((course) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      course.code.toLowerCase().includes(search) ||
      course.name.toLowerCase().includes(search)
    );
  });

  const courseCount = filteredCourses.length;

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Course Catalog
        </h2>

        {/* Search Input */}
        <Input
          type="text"
          placeholder="Search by name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />

        {/* Course Count */}
        <p className="mt-2 text-sm text-gray-500">
          {isLoading ? (
            'Loading courses...'
          ) : (
            `${courseCount} ${courseCount === 1 ? 'course' : 'courses'} found`
          )}
        </p>
      </div>

      {/* Course List */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 p-4">
            Failed to load courses. Please try again.
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center text-gray-500 p-4">
            {searchTerm ? 'No courses match your search.' : 'No courses available.'}
          </div>
        ) : (
          <Droppable droppableId="catalog" isDropDisabled={true}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-2"
              >
                {filteredCourses.map((course, index) => {
                  const courseId = course._id.toString();
                  const isInPlan = planCourseIds.includes(courseId);

                  return (
                    <Draggable
                      key={courseId}
                      draggableId={courseId}
                      index={index}
                      isDragDisabled={isInPlan}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={isInPlan ? 'opacity-50' : ''}
                        >
                          <CourseCard
                            course={course}
                            isDragDisabled={isInPlan}
                          />
                          {isInPlan && (
                            <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-bl-md rounded-tr-md">
                              In Plan
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        )}
      </div>
    </div>
  );
}
