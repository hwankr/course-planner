'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useSession } from 'next-auth/react';
import { useCourses, useCreateCourse } from '@/hooks/useCourses';
import { useDepartments } from '@/hooks/useOnboarding';
import { Input } from '@/components/ui/Input';
import { CategoryDot, CategoryLabel, CATEGORY_NAMES } from '@/components/ui';
import { CustomCourseForm } from './CustomCourseForm';
import { useGuestStore } from '@/stores/guestStore';
import { useGuestProfileStore } from '@/stores/guestProfileStore';
import { useToastStore } from '@/stores/toastStore';
import { Check, ChevronDown, Info, Plus } from 'lucide-react';
import type { Semester, ICourse, RequirementCategory } from '@/types';
import { DEFAULT_CURRICULUM_YEAR } from '@/lib/constants';
import { cn } from '@/lib/utils';

// Quick-add category definitions for common courses tab
const COMMON_QUICK_ADD_CATEGORIES = [
  { key: 'general_required' as RequirementCategory, label: '교양필수', codePrefix: 'PLH-GR' },
  { key: 'general_elective' as RequirementCategory, label: '교양선택', codePrefix: 'PLH-GE' },
  { key: 'free_elective' as RequirementCategory, label: '자유선택', codePrefix: 'PLH-FE' },
  { key: 'teaching' as RequirementCategory, label: '교직', codePrefix: 'PLH-TC' },
];

interface CourseCatalogProps {
  planCourseIds: string[];  // IDs of courses already in the plan (to disable dragging)
  onClickAdd?: (courseId: string, courseData: { code: string; name: string; credits: number; category?: RequirementCategory; departmentId?: string }) => void;
  /** "✓ 추가됨"을 누르면 계획에서 뺀다 */
  onRemove?: (courseId: string) => void;
  focusedSemester?: { year: number; term: string } | null;
  isAddingCourse?: boolean;
  /** 제목 줄 오른쪽 끝 슬롯 (바텀 시트의 "닫기" 등) */
  headerAction?: React.ReactNode;
  className?: string;
}

interface CourseGroup {
  year: number;
  semester: 'spring' | 'fall';
  label: string;
  courses: ICourse[];
  totalCredits: number;
}

function termLabel(term: string) {
  return term === 'spring' ? '1학기' : '2학기';
}

/** 글자 드롭다운: 네이티브 select를 13/600 글자 + ChevronDown으로 그린다 */
function TextSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <label className="relative inline-flex items-center text-ink">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-11 cursor-pointer appearance-none border-0 bg-transparent p-0 pr-[18px] text-[13px] font-semibold text-ink outline-none [field-sizing:content] focus-visible:text-primary md:h-7"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-0 h-3.5 w-3.5" strokeWidth={2.5} />
    </label>
  );
}

// Draggable wrapper for a catalog course item
function CatalogCourseItem({
  course,
  isInPlan,
  focusedSemester,
  isAddingCourse,
  onClickAdd,
  onRemove,
  departmentId,
  deptFilter,
  majorType,
}: {
  course: ICourse;
  isInPlan: boolean;
  focusedSemester: { year: number; term: string } | null | undefined;
  isAddingCourse: boolean;
  onClickAdd?: (courseId: string, data: { code: string; name: string; credits: number; category?: RequirementCategory; departmentId?: string }) => void;
  onRemove?: (courseId: string) => void;
  departmentId?: string;
  deptFilter: 'primary' | 'secondary' | 'common';
  majorType: string;
}) {
  const courseId = String(course._id);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `catalog-${courseId}`,
    disabled: isInPlan,
    data: { containerId: 'catalog', course, departmentId, type: 'catalog' },
  });

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!focusedSemester) {
      useToastStore.getState().addToast({
        message: '추가할 학기를 먼저 선택해 주세요.',
        type: 'info',
        duration: 2500,
      });
      return;
    }
    onClickAdd?.(courseId, {
      code: course.code,
      name: course.name,
      credits: course.credits,
      category: course.category,
      departmentId,
    });
  };

  const tags = [
    course.code,
    `${course.credits}학점`,
    deptFilter === 'secondary' ? (majorType === 'double' ? '복수전공' : '부전공') : null,
    course.createdBy ? '커스텀' : null,
  ].filter(Boolean).join(' · ');

  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        'flex h-14 items-center gap-3 border-b border-line bg-white',
        isInPlan ? 'cursor-default' : 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-40'
      )}
      style={{ transform: CSS.Translate.toString(transform), touchAction: 'none' }}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn('truncate text-[15px] leading-5 font-medium', isInPlan ? 'text-ink-2' : 'text-ink')}>
          {course.name}
        </span>
        <CategoryLabel category={course.category} suffix={tags} className="min-w-0" />
      </div>
      {isInPlan ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.(courseId);
          }}
          disabled={!onRemove}
          className="inline-flex h-11 shrink-0 items-center gap-1 px-1 text-[12px] font-semibold text-positive transition-colors duration-150 ease-out hover:text-negative disabled:cursor-default disabled:hover:text-positive md:h-8"
          aria-label={`${course.name} 계획에서 빼기`}
        >
          <Check aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.5} />
          추가됨
        </button>
      ) : onClickAdd ? (
        <button
          type="button"
          onClick={handleAdd}
          disabled={isAddingCourse}
          className="group/add -mr-1.5 inline-flex h-11 w-11 shrink-0 items-center justify-center disabled:cursor-wait disabled:opacity-40"
          aria-label={
            focusedSemester
              ? `${course.name} ${focusedSemester.year}학년 ${termLabel(focusedSemester.term)}에 추가`
              : `${course.name} 추가`
          }
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line-2 text-ink transition-colors duration-150 ease-out group-hover/add:border-primary group-hover/add:text-primary">
            <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={2.5} />
          </span>
        </button>
      ) : null}
    </li>
  );
}

export function CourseCatalog({ planCourseIds, onClickAdd, onRemove, focusedSemester, isAddingCourse = false, headerAction, className }: CourseCatalogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [yearFilter, setYearFilter] = useState<number | undefined>(undefined);
  const [semesterFilter, setSemesterFilter] = useState<Semester | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<RequirementCategory | undefined>(undefined);
  const { data: session } = useSession();
  const isGuest = useGuestStore((s) => s.isGuest);
  const guestDepartmentId = useGuestProfileStore((s) => s.departmentId);
  const guestSecondaryDepartmentId = useGuestProfileStore((s) => s.secondaryDepartmentId);
  const guestMajorType = useGuestProfileStore((s) => s.majorType);
  const guestCurriculumYear = useGuestProfileStore((s) => s.curriculumYear);
  const effectiveCurriculumYear = (isGuest ? guestCurriculumYear : session?.user?.curriculumYear) || DEFAULT_CURRICULUM_YEAR;
  const userDepartment = (isGuest ? guestDepartmentId : session?.user?.department) || undefined;
  const secondaryDepartment = (isGuest ? guestSecondaryDepartmentId : session?.user?.secondaryDepartment) || undefined;
  const majorType = (isGuest ? guestMajorType : session?.user?.majorType) || 'single';
  const [deptFilter, setDeptFilter] = useState<'primary' | 'secondary' | 'common'>(userDepartment ? 'primary' : 'common');
  const isCommonTab = deptFilter === 'common';
  const activeDepartment = isCommonTab ? undefined : (deptFilter === 'secondary' && secondaryDepartment) ? secondaryDepartment : userDepartment;
  const customCourseDepartment = activeDepartment ?? userDepartment;
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

  // Reset year/semester filters when switching to common tab
  useEffect(() => {
    if (isCommonTab) {
      setYearFilter(undefined);
      setSemesterFilter(undefined);
    }
  }, [isCommonTab]);

  // Conditional fetch strategy: grouped view fetches all, filtered view uses filters
  // Common tab uses quick-add UI, no course fetching needed
  const isGroupedView = !isCommonTab && !debouncedSearch && !yearFilter && !semesterFilter && !categoryFilter;

  const { data: courses = [], isLoading, error } = useCourses(
    isCommonTab
      ? undefined // Common tab uses quick-add UI, skip fetch
      : isGroupedView
        ? { departmentId: activeDepartment, curriculumYear: effectiveCurriculumYear }
        : {
            departmentId: activeDepartment,
            search: debouncedSearch || undefined,
            recommendedYear: yearFilter,
            recommendedSemester: semesterFilter,
            category: categoryFilter,
            curriculumYear: effectiveCurriculumYear,
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

  // Quick-add handler for common courses
  const createCourseMutation = useCreateCourse();
  const [creatingCommon, setCreatingCommon] = useState<string | null>(null);

  const handleQuickAddCommon = useCallback(async (
    categoryKey: RequirementCategory,
    credits: number,
    categoryLabel: string,
  ) => {
    if (!focusedSemester || !onClickAdd) return;

    const loadingKey = `${categoryKey}-${credits}`;
    setCreatingCommon(loadingKey);

    try {
      const code = `PLH-${categoryKey.split('_').map(w => w[0]).join('').toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
      const name = `${categoryLabel} ${credits}학점`;

      const course = await createCourseMutation.mutateAsync({
        code,
        name,
        credits,
        semesters: ['spring', 'fall'] as Semester[],
        category: categoryKey,
      });

      onClickAdd(String(course._id), {
        code,
        name,
        credits,
        category: categoryKey,
        departmentId: undefined,
      });
    } finally {
      setCreatingCommon(null);
    }
  }, [focusedSemester, onClickAdd, createCourseMutation]);

  const courseCount = filteredCourses.length;

  const focusedLabel = focusedSemester
    ? `${focusedSemester.year}학년 ${termLabel(focusedSemester.term)}`
    : null;

  const sourceLabel = isCommonTab
    ? '공통 교양/선택 과목'
    : activeDepartment
      ? (deptFilter === 'secondary' && secondaryDepartment
        ? `${majorType === 'double' ? '복수전공' : '부전공'}: ${secondaryDepartmentName || '학과'} 커리큘럼`
        : `${primaryDepartmentName || '내 학과'} 커리큘럼`)
      : '학과를 설정하면 커리큘럼이 표시됩니다';

  const hasSecondary = Boolean(secondaryDepartment && majorType !== 'single');
  const deptOptions: Array<{ value: 'primary' | 'secondary' | 'common'; label: string }> = [
    ...(userDepartment ? [{ value: 'primary' as const, label: hasSecondary ? '주전공' : '내 학과' }] : []),
    ...(hasSecondary ? [{ value: 'secondary' as const, label: majorType === 'double' ? '복수전공' : '부전공' }] : []),
    { value: 'common' as const, label: '공통' },
  ];

  const renderCourse = (course: ICourse) => {
    const courseId = String(course._id);
    return (
      <CatalogCourseItem
        key={courseId}
        course={course}
        isInPlan={planCourseIds.includes(courseId)}
        focusedSemester={focusedSemester}
        isAddingCourse={isAddingCourse}
        onClickAdd={onClickAdd}
        onRemove={onRemove}
        departmentId={activeDepartment}
        deptFilter={deptFilter}
        majorType={majorType}
      />
    );
  };

  const statusRow = (text: React.ReactNode, tone: 'muted' | 'negative' = 'muted') => (
    <div
      role={tone === 'negative' ? 'alert' : undefined}
      className={cn('flex h-14 items-center text-[13px]', tone === 'negative' ? 'text-negative' : 'text-ink-2')}
    >
      {text}
    </div>
  );

  return (
    <div className={cn('flex min-h-0 flex-col gap-5', className)}>
      {/* Title + 추가될 학기 */}
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="m-0 text-[16px] leading-6 font-bold text-ink">과목 리스트</h2>
          <span className="flex items-baseline gap-3">
            {!isCommonTab && (
              <span className="text-[13px] font-medium tabular-nums text-ink-2" aria-live="polite">
                {isLoading ? '불러오는 중' : `${courseCount}개`}
              </span>
            )}
            {headerAction}
          </span>
        </div>
        <span className="text-[13px] leading-[18px] text-ink-2">
          {focusedLabel ? (
            `${focusedLabel}에 추가돼요`
          ) : (
            '학기를 먼저 선택하면 + 로 바로 추가돼요'
          )}
        </span>
      </div>

      {/* Search - hidden for common tab */}
      {!isCommonTab && (
        <Input
          variant="search"
          aria-label="과목 검색"
          placeholder="과목명, 과목코드"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      )}

      {/* Filters: 글자 드롭다운 */}
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-4">
          <TextSelect
            label="학과"
            value={deptFilter}
            options={deptOptions}
            onChange={setDeptFilter}
          />
          {!isCommonTab && (
            <>
              <TextSelect
                label="학년"
                value={yearFilter ? String(yearFilter) : 'all'}
                options={[
                  { value: 'all', label: '전체 학년' },
                  ...[1, 2, 3, 4, 5, 6].map((y) => ({ value: String(y), label: `${y}학년` })),
                ]}
                onChange={(v) => setYearFilter(v === 'all' ? undefined : Number(v))}
              />
              <TextSelect
                label="학기"
                value={semesterFilter ?? 'all'}
                options={[
                  { value: 'all', label: '전체 학기' },
                  { value: 'spring', label: '1학기' },
                  { value: 'fall', label: '2학기' },
                ]}
                onChange={(v) => setSemesterFilter(v === 'all' ? undefined : (v as Semester))}
              />
              {usedCategories.length > 0 && (
                <TextSelect
                  label="이수구분"
                  value={categoryFilter ?? 'all'}
                  options={[
                    { value: 'all', label: '전체 구분' },
                    ...usedCategories.map((cat) => ({ value: cat, label: CATEGORY_NAMES[cat] })),
                  ]}
                  onChange={(v) => setCategoryFilter(v === 'all' ? undefined : (v as RequirementCategory))}
                />
              )}
            </>
          )}
        </div>

        {/* 커리큘럼 출처 + 안내 */}
        <div className="flex items-center gap-1 text-[12px] leading-4 text-ink-2">
          {!isCommonTab && activeDepartment && <span className="tabular-nums">{effectiveCurriculumYear} ·</span>}
          <span className="truncate">{sourceLabel}</span>
          {(activeDepartment || isCommonTab) && (
            <button
              type="button"
              onClick={() => setShowCurriculumInfo(!showCurriculumInfo)}
              aria-expanded={showCurriculumInfo}
              className="-my-3 inline-flex h-10 w-8 shrink-0 items-center justify-center text-placeholder transition-colors duration-150 ease-out hover:text-ink"
              aria-label="커리큘럼 안내"
            >
              <Info aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {showCurriculumInfo && (
          <p className="m-0 text-[12px] leading-4 text-ink-2">
            본 커리큘럼은 {effectiveCurriculumYear}년 기준이며, 실제와 누락·차이가 있을 수 있습니다.
          </p>
        )}
      </div>

      {/* No Department notice */}
      {!userDepartment && !isCommonTab && (
        <p className="m-0 text-[13px] leading-[18px] text-ink-2">
          <a href="/profile" className="font-semibold text-primary hover:text-primary-hover">
            프로필 설정
          </a>
          에서 학과를 선택하면 해당 학과의 커리큘럼이 표시됩니다.
        </p>
      )}

      {/* Content Area */}
      <div ref={catalogDropRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {isCommonTab ? (
          // Quick-add UI for common courses
          <div className="flex flex-col">
            <p className="m-0 pb-2 text-[13px] leading-[18px] text-ink-2">
              {focusedSemester
                ? '카테고리와 학점을 고르면 선택한 학기에 바로 추가돼요'
                : '학기를 먼저 선택한 뒤 학점을 눌러 추가하세요'}
            </p>
            <ul className="m-0 list-none p-0">
              {COMMON_QUICK_ADD_CATEGORIES.map((cat) => (
                <li key={cat.key} className="flex h-14 items-center gap-3 border-b border-line">
                  <span className="flex min-w-0 flex-1 items-center gap-2 text-[15px] font-medium text-ink">
                    <CategoryDot category={cat.key} />
                    {cat.label}
                  </span>
                  <span className="flex shrink-0 items-center">
                    {[1, 2, 3].map((credits) => {
                      const loadingKey = `${cat.key}-${credits}`;
                      const isCreating = creatingCommon === loadingKey;
                      return (
                        <button
                          key={credits}
                          type="button"
                          onClick={() => handleQuickAddCommon(cat.key, credits, cat.label)}
                          disabled={!focusedSemester || creatingCommon !== null}
                          aria-label={`${cat.label} ${credits}학점 추가`}
                          className="h-11 px-2 text-[13px] font-semibold tabular-nums text-primary transition-colors duration-150 ease-out hover:text-primary-hover disabled:cursor-not-allowed disabled:text-placeholder"
                        >
                          {isCreating ? '추가 중' : `${credits}학점`}
                        </button>
                      );
                    })}
                  </span>
                </li>
              ))}
            </ul>
            <p className="m-0 pt-3 text-[12px] leading-4 text-ink-2">
              추가된 과목은 졸업요건에 자동 반영됩니다. 교양선택→교양학점, 자유선택→전체학점
            </p>
          </div>
        ) : isLoading ? (
          statusRow('과목을 불러오는 중이에요')
        ) : error ? (
          statusRow('과목을 불러오는데 실패했습니다. 다시 시도해주세요.', 'negative')
        ) : filteredCourses.length === 0 ? (
          statusRow(searchTerm ? '검색 결과가 없어요' : '과목이 없어요')
        ) : isGroupedView ? (
          // Grouped view: 권장 학년·학기별 머리줄 + 과목 행
          <div className="flex flex-col">
            {courseGroups.map((group) => (
              <section key={group.label} aria-label={group.label} className="flex flex-col">
                <h3 className="sticky top-0 z-10 m-0 flex h-9 items-end justify-between gap-2 border-b border-line-3 bg-white pb-1.5 text-[13px] font-semibold text-ink">
                  {group.label}
                  <span className="text-[12px] font-medium tabular-nums text-ink-2">
                    {group.courses.length}과목 · {group.totalCredits}학점
                  </span>
                </h3>
                <ul className="m-0 list-none p-0">{group.courses.map(renderCourse)}</ul>
              </section>
            ))}
          </div>
        ) : (
          // Flat view when filters/search active
          <ul className="m-0 list-none p-0">{filteredCourses.map(renderCourse)}</ul>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowCustomForm(true)}
        className="h-10 shrink-0 self-start text-left text-[14px] font-semibold text-primary transition-colors duration-150 ease-out hover:text-primary-hover"
      >
        커스텀 과목 만들기
      </button>

      {/* Custom Course Form Modal */}
      {showCustomForm && (
        <CustomCourseForm
          onClose={() => setShowCustomForm(false)}
          departmentId={customCourseDepartment}
          focusedSemester={focusedSemester}
          onClickAdd={onClickAdd}
        />
      )}
    </div>
  );
}
