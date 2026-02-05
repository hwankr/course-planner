'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { useCourses } from '@/hooks/useCourses';
import { Input } from '@/components/ui/Input';
import { CourseCard } from './CourseCard';
import type { Semester, ICourse } from '@/types';

interface CourseCatalogProps {
  planCourseIds: string[];  // IDs of courses already in the plan (to disable dragging)
  onClickAdd?: (courseId: string, courseData: { code: string; name: string; credits: number; category?: string }) => void;
  focusedSemester?: { year: number; term: string } | null;
  isAddingCourse?: boolean;
}

interface CourseGroup {
  year: number;
  semester: 'spring' | 'fall';
  label: string;
  courses: ICourse[];
  totalCredits: number;
}

export function CourseCatalog({ planCourseIds, onClickAdd, focusedSemester, isAddingCourse = false }: CourseCatalogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [yearFilter, setYearFilter] = useState<number | undefined>(undefined);
  const [semesterFilter, setSemesterFilter] = useState<Semester | undefined>(undefined);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Conditional fetch strategy: grouped view fetches all, filtered view uses filters
  const isGroupedView = !debouncedSearch && !yearFilter && !semesterFilter;

  const { data: courses = [], isLoading, error } = useCourses(
    isGroupedView
      ? {} // Fetch all courses for grouping
      : {
          search: debouncedSearch || undefined,
          recommendedYear: yearFilter,
          recommendedSemester: semesterFilter,
        }
  );

  // Filter courses locally for instant feedback while typing
  const filteredCourses = courses.filter((course) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      course.code.toLowerCase().includes(search) ||
      course.name.toLowerCase().includes(search)
    );
  });

  // Group courses by year and semester when in grouped view
  const courseGroups = useMemo(() => {
    if (!isGroupedView || !courses.length) return [];

    const groups: CourseGroup[] = [];
    const grouped = new Map<string, ICourse[]>();
    const ungrouped: ICourse[] = [];

    for (const course of filteredCourses) {
      if (course.recommendedYear && course.recommendedSemester) {
        const key = `${course.recommendedYear}-${course.recommendedSemester}`;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(course);
      } else {
        ungrouped.push(course);
      }
    }

    // Sort by year then semester (spring before fall)
    const sortedKeys = Array.from(grouped.keys()).sort((a, b) => {
      const [yearA, semA] = a.split('-');
      const [yearB, semB] = b.split('-');
      if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
      return semA === 'spring' ? -1 : 1;
    });
    for (const key of sortedKeys) {
      const [yearStr, sem] = key.split('-');
      const year = parseInt(yearStr);
      const courses = grouped.get(key)!;
      const semLabel = sem === 'spring' ? '1학기' : '2학기';
      groups.push({
        year,
        semester: sem as 'spring' | 'fall',
        label: `${year}학년 ${semLabel}`,
        courses,
        totalCredits: courses.reduce((sum, c) => sum + c.credits, 0),
      });
    }

    if (ungrouped.length > 0) {
      groups.push({
        year: 99,
        semester: 'spring',
        label: '기타',
        courses: ungrouped,
        totalCredits: ungrouped.reduce((sum, c) => sum + c.credits, 0),
      });
    }

    return groups;
  }, [filteredCourses, isGroupedView, courses.length]);

  const courseCount = filteredCourses.length;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Compact Header Row */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Title */}
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              과목 카탈로그
            </h2>
            <p className="text-xs text-gray-400">
              디지털융합대학 컴퓨터학부 소프트웨어융합전공
            </p>
          </div>

          {/* Search Input */}
          <Input
            type="text"
            placeholder="과목명 또는 코드 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />

          {/* Year filter chips */}
          <div className="flex gap-1.5">
            {[undefined, 1, 2, 3, 4].map((y) => (
              <button
                key={y ?? 'all'}
                onClick={() => setYearFilter(y)}
                className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors
                  ${yearFilter === y
                    ? 'bg-indigo-500 text-white'
                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
              >
                {y ? `${y}학년` : '전체'}
              </button>
            ))}
          </div>

          {/* Semester filter chips */}
          <div className="flex gap-1.5">
            {([undefined, 'spring', 'fall'] as const).map((s) => (
              <button
                key={s ?? 'all'}
                onClick={() => setSemesterFilter(s as Semester | undefined)}
                className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors
                  ${semesterFilter === s
                    ? 'bg-emerald-500 text-white'
                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
              >
                {s === 'spring' ? '1학기' : s === 'fall' ? '2학기' : '전체'}
              </button>
            ))}
          </div>

          {/* Course Count */}
          <span className="text-sm text-gray-500 ml-auto">
            {isLoading ? (
              '로딩 중...'
            ) : (
              `${courseCount}개 과목`
            )}
          </span>

          {/* Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label={isCollapsed ? '펼치기' : '접기'}
          >
            <svg
              className={`w-5 h-5 text-gray-600 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Focus Banner */}
      {!isCollapsed && focusedSemester && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 text-xs text-blue-700">
          <span className="font-medium">
            {focusedSemester.year}학년 {focusedSemester.term === 'spring' ? '1학기' : '2학기'}
          </span>
          에 추가 중 — + 버튼을 클릭하세요
        </div>
      )}

      {/* Content Area - Only visible when not collapsed */}
      {!isCollapsed && (
        <div className="max-h-[400px] overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 p-4">
              과목을 불러오는데 실패했습니다. 다시 시도해주세요.
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center text-gray-500 p-4">
              {searchTerm ? '검색 결과가 없습니다.' : '과목이 없습니다.'}
            </div>
          ) : isGroupedView ? (
            // Grouped view: Horizontal columns for each year-semester group
            <Droppable droppableId="catalog" isDropDisabled={true}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex gap-4 overflow-x-auto pb-2"
                >
                  {(() => {
                    let globalIndex = 0;
                    return courseGroups.map((group) => (
                      <div
                        key={group.label}
                        className="flex-shrink-0 w-64 flex flex-col"
                      >
                        {/* Non-draggable group header */}
                        <div className="bg-gray-100 px-3 py-2 rounded-t-md border-b-2 border-gray-300 sticky top-0 z-10">
                          <div className="text-sm font-semibold text-gray-800">
                            {group.label}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {group.courses.length}과목 · {group.totalCredits}학점
                          </div>
                        </div>

                        {/* Courses in vertical list within this column */}
                        <div className="flex-1 overflow-y-auto max-h-[320px] space-y-2 pt-2">
                          {group.courses.map((course) => {
                            const courseId = course._id.toString();
                            const isInPlan = planCourseIds.includes(courseId);
                            const currentIndex = globalIndex++;

                            return (
                              <Draggable
                                key={courseId}
                                draggableId={courseId}
                                index={currentIndex}
                                isDragDisabled={isInPlan}
                              >
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`relative ${isInPlan ? 'opacity-50' : ''}`}
                                  >
                                    <div {...provided.dragHandleProps}>
                                      <CourseCard
                                        course={course}
                                        isDragDisabled={isInPlan}
                                        compact={false}
                                      />
                                    </div>

                                    {/* "+" button */}
                                    {focusedSemester && !isInPlan && onClickAdd && (
                                      <button
                                        onClick={() => onClickAdd(course._id.toString(), {
                                          code: course.code,
                                          name: course.name,
                                          credits: course.credits,
                                          category: course.category,
                                        })}
                                        disabled={isAddingCourse}
                                        className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold transition-colors shadow-sm z-10
                                          ${isAddingCourse ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                                        aria-label={`${course.name}을(를) 학기에 추가`}
                                      >
                                        {isAddingCourse ? '...' : '+'}
                                      </button>
                                    )}

                                    {/* In Plan badge */}
                                    {isInPlan && (
                                      <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-bl-md rounded-tr-md">
                                        추가됨
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ) : (
            // Flat view: Multi-column grid when filters/search active
            <Droppable droppableId="catalog" isDropDisabled={true}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="grid grid-cols-5 gap-3"
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
                            <div {...provided.dragHandleProps}>
                              <CourseCard
                                course={course}
                                isDragDisabled={isInPlan}
                                compact={false}
                              />
                            </div>

                            {/* "+" button */}
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
      )}
    </div>
  );
}
