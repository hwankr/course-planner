'use client';

import { useState, useEffect } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { useCourses } from '@/hooks/useCourses';
import { Input } from '@/components/ui/Input';
import { CourseCard } from './CourseCard';
import type { Semester } from '@/types';

interface CourseCatalogProps {
  planCourseIds: string[];  // IDs of courses already in the plan (to disable dragging)
  onClickAdd?: (courseId: string, courseData: { code: string; name: string; credits: number; category?: string }) => void;
  focusedSemester?: { year: number; term: string } | null;
  isAddingCourse?: boolean;
}

export function CourseCatalog({ planCourseIds, onClickAdd, focusedSemester, isAddingCourse = false }: CourseCatalogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [yearFilter, setYearFilter] = useState<number | undefined>(undefined);
  const [semesterFilter, setSemesterFilter] = useState<Semester | undefined>(undefined);

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
    recommendedYear: yearFilter,
    recommendedSemester: semesterFilter,
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
            <>
              {courseCount} {courseCount === 1 ? 'course' : 'courses'} found
              {(yearFilter || semesterFilter) && (
                <span className="text-blue-600">
                  {' '}({yearFilter ? `${yearFilter}학년` : ''}{yearFilter && semesterFilter ? ' ' : ''}
                  {semesterFilter === 'spring' ? '봄' : semesterFilter === 'summer' ? '여름' : semesterFilter === 'fall' ? '가을' : semesterFilter === 'winter' ? '겨울' : ''})
                </span>
              )}
            </>
          )}
        </p>
      </div>

      {/* Filter dropdowns */}
      <div className="px-4 pb-3 flex gap-2 border-b border-gray-200">
        <select
          value={yearFilter ?? ''}
          onChange={(e) => setYearFilter(e.target.value ? parseInt(e.target.value, 10) : undefined)}
          className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">전체 학년</option>
          <option value="1">1학년</option>
          <option value="2">2학년</option>
          <option value="3">3학년</option>
          <option value="4">4학년</option>
        </select>
        <select
          value={semesterFilter ?? ''}
          onChange={(e) => setSemesterFilter(e.target.value ? e.target.value as Semester : undefined)}
          className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">전체 학기</option>
          <option value="spring">봄</option>
          <option value="summer">여름</option>
          <option value="fall">가을</option>
          <option value="winter">겨울</option>
        </select>
      </div>

      {/* Focus Banner */}
      {focusedSemester && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 text-xs text-blue-700">
          <span className="font-medium">
            {focusedSemester.year}년 {focusedSemester.term === 'spring' ? '1학기' : '2학기'}
          </span>
          에 추가 중 — + 버튼을 클릭하세요
        </div>
      )}

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
            {(provided) => (
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
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`relative ${isInPlan ? 'opacity-50' : ''}`}
                        >
                          {/* Drag handle wraps the card */}
                          <div {...provided.dragHandleProps}>
                            <CourseCard
                              course={course}
                              isDragDisabled={isInPlan}
                            />
                          </div>

                          {/* "+" button — OUTSIDE drag handle, no conflict */}
                          {focusedSemester && !isInPlan && onClickAdd && (
                            <button
                              onClick={() => onClickAdd(course._id.toString(), {
                                code: course.code,
                                name: course.name,
                                credits: course.credits,
                                category: course.category,
                              })}
                              disabled={isAddingCourse}
                              className={`absolute top-2 right-2 w-6 h-6 rounded-full
                                         flex items-center justify-center text-sm font-bold
                                         transition-colors shadow-sm z-10
                                         ${isAddingCourse
                                           ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                           : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                              aria-label={`${course.name}을(를) 학기에 추가`}
                            >
                              {isAddingCourse ? '...' : '+'}
                            </button>
                          )}

                          {/* In Plan badge */}
                          {isInPlan && (
                            <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-bl-md rounded-tr-md">
                              추가됨
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
