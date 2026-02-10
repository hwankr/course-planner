'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useSession } from 'next-auth/react';
import { useCourses } from '@/hooks/useCourses';
import { useDepartments } from '@/hooks/useOnboarding';
import { Input } from '@/components/ui/Input';
import { CourseCard } from './CourseCard';
import { CustomCourseForm } from './CustomCourseForm';
import { useGuestStore } from '@/stores/guestStore';
import { useGuestProfileStore } from '@/stores/guestProfileStore';
import { HelpCircle, LayoutGrid, List } from 'lucide-react';
import type { Semester, ICourse, RequirementCategory } from '@/types';

interface CourseCatalogProps {
  planCourseIds: string[];  // IDs of courses already in the plan (to disable dragging)
  onClickAdd?: (courseId: string, courseData: { code: string; name: string; credits: number; category?: RequirementCategory }) => void;
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

// Category labels and colors for list view
const catalogCategoryLabels: Record<string, string> = {
  major_required: '전핵',
  major_compulsory: '전필',
  major_elective: '전선',
  general_required: '교필',
  general_elective: '교선',
  teaching: '교직',
  free_elective: '자선',
};

const catalogCategoryColors: Record<string, string> = {
  major_required: 'bg-red-100 text-red-700',
  major_compulsory: 'bg-rose-100 text-rose-700',
  major_elective: 'bg-orange-100 text-orange-700',
  general_required: 'bg-blue-100 text-blue-700',
  general_elective: 'bg-green-100 text-green-700',
  teaching: 'bg-violet-100 text-violet-700',
  free_elective: 'bg-gray-100 text-gray-600',
};

// Draggable wrapper for a catalog course item
function CatalogCourseItem({
  course,
  isInPlan,
  viewMode,
  focusedSemester,
  isAddingCourse,
  onClickAdd,
  deptFilter,
  majorType,
  className: extraClassName,
}: {
  course: ICourse;
  isInPlan: boolean;
  viewMode: 'card' | 'list';
  focusedSemester: { year: number; term: string } | null | undefined;
  isAddingCourse: boolean;
  onClickAdd?: (courseId: string, data: { code: string; name: string; credits: number; category?: RequirementCategory }) => void;
  deptFilter: 'primary' | 'secondary';
  majorType: string;
  className?: string;
}) {
  const courseId = String(course._id);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `catalog-${courseId}`,
    disabled: isInPlan,
    data: { containerId: 'catalog', course, type: 'catalog' },
  });

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onClickAdd?.(courseId, {
      code: course.code,
      name: course.name,
      credits: course.credits,
      category: course.category,
    });
  };

  if (viewMode === 'list') {
    return (
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className={`relative ${isInPlan ? 'opacity-50' : ''} ${isDragging ? 'opacity-50' : ''} ${extraClassName || ''}`}
        style={{ transform: CSS.Translate.toString(transform), touchAction: 'none' }}
      >
        <div className="flex items-center gap-1.5 px-2 py-1 hover:bg-gray-50 rounded text-xs">
          {course.category && (
            <span className={`text-[10px] px-1 py-0.5 rounded font-medium whitespace-nowrap ${catalogCategoryColors[course.category] || 'bg-gray-100 text-gray-600'}`}>
              {catalogCategoryLabels[course.category]}
            </span>
          )}
          {deptFilter === 'secondary' && (
            <span className={`text-[10px] px-1 py-0.5 rounded font-medium whitespace-nowrap ${majorType === 'double' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
              {majorType === 'double' ? '복수' : '부전'}
            </span>
          )}
          <span className="flex-1 truncate text-gray-800 font-medium">{course.name}</span>
          <span className="text-[10px] text-gray-500 whitespace-nowrap">{course.credits}학점</span>
          {course.createdBy && (
            <span className="text-[10px] text-emerald-600 font-medium">커스텀</span>
          )}
          {isInPlan && (
            <span className="text-[10px] text-[#153974]/60">추가됨</span>
          )}
          {focusedSemester && !isInPlan && onClickAdd && (
            <button
              onClick={handleAdd}
              disabled={isAddingCourse}
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isAddingCourse ? 'bg-gray-300 text-gray-500' : 'bg-[#153974] text-white hover:bg-[#003E7E]'}`}
              aria-label={`${course.name} 추가`}
            >
              +
            </button>
          )}
        </div>
      </div>
    );
  }

  // Card view
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`relative ${isInPlan ? 'opacity-50' : ''} ${isDragging ? 'opacity-50' : ''} ${extraClassName || ''}`}
      style={{ transform: CSS.Translate.toString(transform), touchAction: 'none' }}
    >
      <CourseCard
        course={course}
        isDragDisabled={isInPlan}
        compact={false}
        departmentLabel={deptFilter === 'secondary' ? (majorType === 'double' ? '복수전공' : '부전공') : undefined}
      />

      {/* "+" button */}
      {focusedSemester && !isInPlan && onClickAdd && (
        <button
          onClick={handleAdd}
          disabled={isAddingCourse}
          className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold transition-colors shadow-sm z-10
            ${isAddingCourse ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#153974] text-white hover:bg-[#003E7E]'}`}
          aria-label={`${course.name}을(를) 학기에 추가`}
        >
          {isAddingCourse ? '...' : '+'}
        </button>
      )}

      {/* Custom badge */}
      {course.createdBy && (
        <div className="absolute top-0 left-0 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-br-md rounded-tl-md">
          커스텀
        </div>
      )}

      {/* In Plan badge */}
      {isInPlan && (
        <div className="absolute top-0 right-0 bg-[#153974]/10 text-[#153974] text-[10px] px-1.5 py-0.5 rounded-bl-md rounded-tr-md">
          추가됨
        </div>
      )}
    </div>
  );
}

export function CourseCatalog({ planCourseIds, onClickAdd, focusedSemester, isAddingCourse = false }: CourseCatalogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [yearFilter, setYearFilter] = useState<number | undefined>(undefined);
  const [semesterFilter, setSemesterFilter] = useState<Semester | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<RequirementCategory | undefined>(undefined);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list');
  const { data: session } = useSession();
  const isGuest = useGuestStore((s) => s.isGuest);
  const guestDepartmentId = useGuestProfileStore((s) => s.departmentId);
  const guestSecondaryDepartmentId = useGuestProfileStore((s) => s.secondaryDepartmentId);
  const guestMajorType = useGuestProfileStore((s) => s.majorType);
  const userDepartment = (isGuest ? guestDepartmentId : session?.user?.department) || undefined;
  const secondaryDepartment = (isGuest ? guestSecondaryDepartmentId : session?.user?.secondaryDepartment) || undefined;
  const majorType = (isGuest ? guestMajorType : session?.user?.majorType) || 'single';
  const [deptFilter, setDeptFilter] = useState<'primary' | 'secondary'>('primary');
  const activeDepartment = (deptFilter === 'secondary' && secondaryDepartment) ? secondaryDepartment : userDepartment;
  // Resolve department names for display
  const { data: departments = [] } = useDepartments();
  const guestDepartmentName = useGuestProfileStore((s) => s.departmentName);
  const guestSecondaryDepartmentName = useGuestProfileStore((s) => s.secondaryDepartmentName);
  const primaryDepartmentName = isGuest
    ? guestDepartmentName
    : departments.find(d => d._id === userDepartment)?.name;
  const secondaryDepartmentName = isGuest
    ? guestSecondaryDepartmentName
    : departments.find(d => d._id === secondaryDepartment)?.name;
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [showCurriculumInfo, setShowCurriculumInfo] = useState(false);

  const { setNodeRef: catalogDropRef } = useDroppable({ id: 'catalog' });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Conditional fetch strategy: grouped view fetches all, filtered view uses filters
  const isGroupedView = !debouncedSearch && !yearFilter && !semesterFilter && !categoryFilter;

  const { data: courses = [], isLoading, error } = useCourses(
    isGroupedView
      ? { departmentId: activeDepartment }
      : {
          departmentId: activeDepartment,
          search: debouncedSearch || undefined,
          recommendedYear: yearFilter,
          recommendedSemester: semesterFilter,
          category: categoryFilter,
        }
  );

  // Filter courses locally for instant feedback while typing
  const filteredCourses = courses.filter((course) => {
    // Category filter
    if (categoryFilter && course.category !== categoryFilter) return false;
    // Search filter
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      course.code.toLowerCase().includes(search) ||
      course.name.toLowerCase().includes(search)
    );
  });

  // Persist usedCategories across category filter changes.
  const usedCategoriesRef = useRef<RequirementCategory[]>([]);
  const usedCategories = useMemo(() => {
    if (categoryFilter) return usedCategoriesRef.current;
    const cats = new Set<RequirementCategory>();
    for (const course of courses) {
      if (course.category) cats.add(course.category);
    }
    const order: RequirementCategory[] = [
      'major_required', 'major_compulsory', 'major_elective',
      'general_required', 'general_elective', 'teaching', 'free_elective'
    ];
    const result = order.filter(cat => cats.has(cat));
    usedCategoriesRef.current = result;
    return result;
  }, [courses, categoryFilter]);

  useEffect(() => {
    if (categoryFilter && !usedCategories.includes(categoryFilter)) {
      setCategoryFilter(undefined);
    }
  }, [usedCategories, categoryFilter]);

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
      const [yearB] = b.split('-');
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
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm transition-opacity duration-200">
      {/* Header */}
      <div className="px-3 sm:px-4 py-3 border-b border-gray-200 space-y-2.5">
        {/* Row 1: Title + Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900">과목 리스트</h2>
            <div className="flex items-center gap-1">
              <p className="text-xs text-gray-400 truncate">
                {activeDepartment
                  ? (deptFilter === 'secondary' && secondaryDepartment
                    ? `${majorType === 'double' ? '복수전공' : '부전공'}: ${secondaryDepartmentName || '학과'} 커리큘럼`
                    : `${primaryDepartmentName || '내 학과'} 커리큘럼`)
                  : '학과를 설정하면 커리큘럼이 표시됩니다'}
              </p>
              {activeDepartment && (
                <button
                  onClick={() => setShowCurriculumInfo(!showCurriculumInfo)}
                  className="flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors"
                  aria-label="커리큘럼 안내"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {showCurriculumInfo && (
              <p className="text-[11px] text-amber-600 bg-amber-50 rounded px-2 py-1 mt-1">
                본 커리큘럼은 2025년 기준이며, 실제와 누락·차이가 있을 수 있습니다.
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xs text-gray-500 hidden sm:inline">
              {isLoading ? '로딩...' : `${courseCount}개`}
            </span>
            <div className="flex items-center border rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode('card')}
                className={`p-1 transition-colors ${viewMode === 'card' ? 'bg-[#153974] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                aria-label="카드 뷰"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 transition-colors ${viewMode === 'list' ? 'bg-[#153974] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                aria-label="리스트 뷰"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={() => setShowCustomForm(true)}
              className="px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
            >
              + 추가
            </button>
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

        {/* Row 2: Search + Count (mobile) */}
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="과목명 또는 코드 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <span className="text-xs text-gray-500 sm:hidden flex-shrink-0">
              {isLoading ? '...' : `${courseCount}개`}
            </span>
          </div>
        )}

        {/* Row 3: Filters */}
        {!isCollapsed && (
          <div className="space-y-1.5">
            {/* Department filter (for multi-major) */}
            {secondaryDepartment && majorType !== 'single' && (
              <div className="flex items-center gap-1 pb-1">
                <span className="text-[11px] font-medium text-gray-400">학과</span>
                <button
                  onClick={() => setDeptFilter('primary')}
                  className={`px-2 py-0.5 text-xs rounded-full font-medium transition-colors ${
                    deptFilter === 'primary'
                      ? 'bg-[#153974] text-white'
                      : 'bg-[#153974]/10 text-[#153974] hover:bg-[#153974]/20'
                  }`}
                >
                  주전공
                </button>
                <button
                  onClick={() => setDeptFilter('secondary')}
                  className={`px-2 py-0.5 text-xs rounded-full font-medium transition-colors ${
                    deptFilter === 'secondary'
                      ? (majorType === 'double' ? 'bg-purple-500 text-white' : 'bg-orange-500 text-white')
                      : (majorType === 'double' ? 'bg-purple-50 text-purple-600 hover:bg-purple-100' : 'bg-orange-50 text-orange-600 hover:bg-orange-100')
                  }`}
                >
                  {majorType === 'double' ? '복수전공' : '부전공'}
                </button>
              </div>
            )}
            {/* Year + Semester filters */}
            <div className="flex items-center gap-x-3 gap-y-1 flex-wrap">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-medium text-gray-400 w-7">학년</span>
                {[undefined, 1, 2, 3, 4, 5, 6].map((y) => (
                  <button
                    key={y ?? 'all'}
                    onClick={() => setYearFilter(y)}
                    className={`px-2 py-0.5 text-xs rounded-full font-medium transition-colors
                      ${yearFilter === y
                        ? 'bg-[#153974] text-white'
                        : 'bg-[#153974]/10 text-[#153974] hover:bg-[#153974]/20'}`}
                  >
                    {y ? `${y}` : '전체'}
                  </button>
                ))}
              </div>

              <div className="w-px h-4 bg-gray-200" />

              <div className="flex items-center gap-1">
                <span className="text-[11px] font-medium text-gray-400 w-7">학기</span>
                {([undefined, 'spring', 'fall'] as const).map((s) => (
                  <button
                    key={s ?? 'all'}
                    onClick={() => setSemesterFilter(s as Semester | undefined)}
                    className={`px-2 py-0.5 text-xs rounded-full font-medium transition-colors
                      ${semesterFilter === s
                        ? 'bg-emerald-500 text-white'
                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                  >
                    {s === 'spring' ? '1학기' : s === 'fall' ? '2학기' : '전체'}
                  </button>
                ))}
              </div>
            </div>

            {/* Category filter */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[11px] font-medium text-gray-400">이수</span>
              {([undefined, ...usedCategories] as (RequirementCategory | undefined)[]).map((cat) => {
                const labels: Record<string, string> = {
                  major_required: '전공핵심',
                  major_compulsory: '전공필수',
                  major_elective: '전공선택',
                  general_required: '교양필수',
                  general_elective: '교양선택',
                  teaching: '교직',
                  free_elective: '자유선택',
                };
                const chipColors: Record<string, { active: string; inactive: string }> = {
                  major_required: { active: 'bg-red-500 text-white', inactive: 'bg-red-50 text-red-600 hover:bg-red-100' },
                  major_compulsory: { active: 'bg-rose-500 text-white', inactive: 'bg-rose-50 text-rose-600 hover:bg-rose-100' },
                  major_elective: { active: 'bg-orange-500 text-white', inactive: 'bg-orange-50 text-orange-600 hover:bg-orange-100' },
                  general_required: { active: 'bg-blue-500 text-white', inactive: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
                  general_elective: { active: 'bg-green-500 text-white', inactive: 'bg-green-50 text-green-600 hover:bg-green-100' },
                  teaching: { active: 'bg-violet-500 text-white', inactive: 'bg-violet-50 text-violet-600 hover:bg-violet-100' },
                  free_elective: { active: 'bg-gray-500 text-white', inactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200' },
                };
                return (
                  <button
                    key={cat ?? 'all'}
                    onClick={() => setCategoryFilter(cat as RequirementCategory | undefined)}
                    className={`px-2 py-0.5 text-xs rounded-full font-medium transition-colors whitespace-nowrap
                      ${categoryFilter === cat
                        ? (cat ? chipColors[cat].active : 'bg-[#153974] text-white')
                        : (cat ? chipColors[cat].inactive : 'bg-[#153974]/10 text-[#153974] hover:bg-[#153974]/20')}`}
                  >
                    {cat ? labels[cat] : '전체'}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* No Department Banner */}
      {!isCollapsed && !userDepartment && (
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 text-sm text-amber-700">
          <a href="/profile" className="font-medium underline hover:text-amber-800">
            프로필 설정
          </a>
          에서 학과를 선택하면 해당 학과의 커리큘럼이 표시됩니다.
        </div>
      )}

      {/* Focus Banner */}
      {!isCollapsed && focusedSemester && (
        <div className="px-4 py-2 bg-[#153974]/5 border-b border-[#153974]/20 text-xs text-[#153974]">
          <span className="font-medium">
            {focusedSemester.year}학년 {focusedSemester.term === 'spring' ? '1학기' : '2학기'}
          </span>
          에 추가 중 — + 버튼을 클릭하세요
        </div>
      )}

      {/* Content Area - Only visible when not collapsed */}
      {!isCollapsed && (
        <div className="max-h-[350px] sm:max-h-[400px] overflow-y-auto p-3 sm:p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3069B3]"></div>
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
            <div
              ref={catalogDropRef}
              className="flex gap-4 overflow-x-auto pb-2"
            >
              {courseGroups.map((group) => (
                <div
                  key={group.label}
                  className="flex-shrink-0 w-56 sm:w-64 flex flex-col"
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
                  <div className={`flex-1 overflow-y-auto max-h-[320px] pt-2 ${viewMode === 'list' ? 'space-y-0.5' : 'space-y-2'}`}>
                    {group.courses.map((course) => {
                      const courseId = String(course._id);
                      const isInPlan = planCourseIds.includes(courseId);
                      return (
                        <CatalogCourseItem
                          key={courseId}
                          course={course}
                          isInPlan={isInPlan}
                          viewMode={viewMode}
                          focusedSemester={focusedSemester}
                          isAddingCourse={isAddingCourse}
                          onClickAdd={onClickAdd}
                          deptFilter={deptFilter}
                          majorType={majorType}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Flat view: Multi-column grid when filters/search active
            <div
              ref={catalogDropRef}
              className={viewMode === 'list' ? 'space-y-0.5' : 'flex flex-wrap gap-3'}
            >
              {filteredCourses.map((course) => {
                const courseId = String(course._id);
                const isInPlan = planCourseIds.includes(courseId);
                return (
                  <CatalogCourseItem
                    key={courseId}
                    course={course}
                    isInPlan={isInPlan}
                    viewMode={viewMode}
                    focusedSemester={focusedSemester}
                    isAddingCourse={isAddingCourse}
                    onClickAdd={onClickAdd}
                    deptFilter={deptFilter}
                    majorType={majorType}
                    className={viewMode === 'card' ? 'w-full sm:w-[calc(50%-6px)] md:w-[calc(33.333%-8px)] lg:w-[calc(25%-9px)] xl:w-[calc(20%-9.6px)]' : undefined}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Custom Course Form Modal */}
      {showCustomForm && (
        <CustomCourseForm onClose={() => setShowCustomForm(false)} availableCategories={usedCategories} />
      )}
    </div>
  );
}
