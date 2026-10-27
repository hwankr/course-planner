'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdminMutation, useAdminFormSession } from '../_components/useAdminMutation';
import { invalidateAdminData } from '../_components/adminCache';
import { useAuth } from '@/hooks/useAuth';
import { useToastStore } from '@/stores/toastStore';
import { Button, Input, Select, Textarea, CategoryLabel } from '@/components/ui';
import { AdminHeader, AdminRow, AdminLoading } from '../_components/AdminParts';
import { AdminDialog, AdminConfirmDialog } from '../_components/AdminDialog';
import { Plus, Pencil, Trash2, X, BookOpen } from 'lucide-react';
import { DEFAULT_CURRICULUM_YEAR } from '@/lib/constants';
import { buildOfficialCoursePayload, type CourseFormData } from './courseForm';
import { AdminPagination } from '../_components/AdminPagination';
import type { Pagination } from '@/types/admin';
import type { RequirementCategory, Semester } from '@/types';

// ============================================
// Types
// ============================================

interface DepartmentItem {
  _id: string;
  code: string;
  name: string;
}

interface CourseItem {
  _id: string;
  code: string;
  name: string;
  credits: number;
  department?: DepartmentItem;
  semesters: Semester[];
  category?: RequirementCategory;
  recommendedYear?: number;
  recommendedSemester?: Semester;
  description?: string;
  isActive: boolean;
}



// ============================================
// Constants
// ============================================

const CATEGORY_LABELS: Record<RequirementCategory, string> = {
  major_required: '전공핵심',
  major_compulsory: '전공필수',
  major_elective: '전공선택',
  general_required: '교양필수',
  general_elective: '교양선택',
  free_elective: '자유선택',
  teaching: '교직',
};

const SEMESTER_LABELS: Record<Semester, string> = {
  spring: '1학기',
  summer: '여름학기',
  fall: '2학기',
  winter: '겨울학기',
};

const ALL_SEMESTERS: Semester[] = ['spring', 'summer', 'fall', 'winter'];
const ALL_CATEGORIES: RequirementCategory[] = [
  'major_required', 'major_compulsory', 'major_elective',
  'general_required', 'general_elective', 'free_elective', 'teaching',
];

const EMPTY_FORM: CourseFormData = {
  code: '',
  name: '',
  credits: 3,
  department: '',
  category: '',
  semesters: [],
  recommendedYear: '1',
  recommendedSemester: 'spring',
  curriculumYear: DEFAULT_CURRICULUM_YEAR,
  description: '',
};

// ============================================
// Component
// ============================================

export default function AdminCoursesPage() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const addToast = useToastStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const formSession = useAdminFormSession();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<RequirementCategory | ''>('');
  const [yearFilter, setYearFilter] = useState(DEFAULT_CURRICULUM_YEAR);

  const [page, setPage] = useState(1);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);
  const [formData, setFormData] = useState<CourseFormData>(EMPTY_FORM);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ---- Queries ----

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    if (departmentFilter) params.set('departmentId', departmentFilter);
    if (categoryFilter) params.set('category', categoryFilter);
    if (yearFilter) params.set('curriculumYear', String(yearFilter));
    params.set('page', String(page));
    params.set('limit', '50');
    return params.toString();
  };

  const { data: coursesData, isLoading, error } = useQuery<{ success: boolean; data: CourseItem[]; pagination: Pagination }>({
    queryKey: ['admin-courses', searchTerm, departmentFilter, categoryFilter, yearFilter, page],
    queryFn: async () => {
      const qs = buildQueryString();
      const res = await fetch(`/api/courses${qs ? `?${qs}` : ''}`);
      if (!res.ok) throw new Error('과목 목록을 불러오는데 실패했습니다.');
      return res.json();
    },
    enabled: isAdmin && !authLoading,
  });

  const { data: departmentsData, isError: departmentsError, refetch: retryDepartments } = useQuery<{ success: boolean; data: DepartmentItem[] }>({
    queryKey: ['admin-departments'],
    queryFn: async () => {
      const res = await fetch('/api/departments');
      if (!res.ok) throw new Error('학과 목록을 불러오는데 실패했습니다.');
      return res.json();
    },
    enabled: isAdmin && !authLoading,
  });

  // ---- Mutations ----

  const { mutate: createCourse, isPending: isCreating } = useAdminMutation({
    mutationFn: async (data: CourseFormData) => {
      const body = buildOfficialCoursePayload(data);

      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || '과목 생성에 실패했습니다.');
      return result;
    },
    onSuccess: (_result, _variables, sessionId) => {
      void invalidateAdminData(queryClient, 'courses');
      addToast({ type: 'success', message: '과목이 생성되었습니다.' });
      if (formSession.isCurrent(sessionId)) closeForm();
    },
    onError: (err: Error) => {
      addToast({ type: 'warning', message: err.message });
    },
  }, formSession);

  const { mutate: updateCourse, isPending: isUpdating } = useAdminMutation({
    mutationFn: async ({ id, data }: { id: string; data: CourseFormData }) => {
      const body: Record<string, unknown> = {
        code: data.code.toUpperCase(),
        name: data.name,
        credits: data.credits,
        semesters: data.semesters,
      };
      if (data.department) body.department = data.department;
      else body.department = '';
      if (data.category) body.category = data.category;
      if (data.recommendedYear) body.recommendedYear = parseInt(data.recommendedYear, 10);
      if (data.description.trim()) body.description = data.description.trim();

      const res = await fetch(`/api/courses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || '과목 수정에 실패했습니다.');
      return result;
    },
    onSuccess: (_result, _variables, sessionId) => {
      void invalidateAdminData(queryClient, 'courses');
      addToast({ type: 'success', message: '과목이 수정되었습니다.' });
      if (formSession.isCurrent(sessionId)) closeForm();
    },
    onError: (err: Error) => {
      addToast({ type: 'warning', message: err.message });
    },
  }, formSession);

  const { mutate: deleteCourse, isPending: isDeleting } = useAdminMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/courses/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || '과목 삭제에 실패했습니다.');
      return result;
    },
    onSuccess: (_result, _variables, sessionId) => {
      void invalidateAdminData(queryClient, 'courses');
      addToast({ type: 'success', message: '과목이 삭제되었습니다.' });
      if (formSession.isCurrent(sessionId)) setDeletingId(null);
    },
    onError: (err: Error, _variables, sessionId) => {
      addToast({ type: 'warning', message: err.message });
      if (formSession.isCurrent(sessionId)) setDeletingId(null);
    },
  }, formSession);

  // ---- Handlers ----

  const openCreateForm = () => {
    setEditingCourse(null);
    setFormData(EMPTY_FORM);
    formSession.begin();
    setShowForm(true);
  };

  const openEditForm = (course: CourseItem) => {
    setEditingCourse(course);
    setFormData({
      code: course.code,
      name: course.name,
      credits: course.credits,
      department: course.department?._id || '',
      category: course.category || '',
      semesters: [...course.semesters],
      recommendedYear: course.recommendedYear?.toString() || '1',
      recommendedSemester: course.recommendedSemester === 'fall' ? 'fall' : 'spring',
      curriculumYear: yearFilter,
      description: course.description || '',
    });
    formSession.begin();
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCourse(null);
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating || isUpdating) return;
    if (!formData.code.trim() || !formData.name.trim() || formData.semesters.length === 0) {
      addToast({ type: 'warning', message: '과목 코드, 과목명, 개설 학기는 필수입니다.' });
      return;
    }
    if (editingCourse) {
      updateCourse({ id: editingCourse._id, data: formData });
    } else {
      try { buildOfficialCoursePayload(formData); } catch (error) {
        addToast({ type: 'warning', message: (error as Error).message }); return;
      }
      createCourse(formData);
    }
  };

  const toggleSemester = (sem: Semester) => {
    setFormData((prev) => ({
      ...prev,
      semesters: prev.semesters.includes(sem)
        ? prev.semesters.filter((s) => s !== sem)
        : [...prev.semesters, sem],
    }));
  };

  // ---- Auth guard ----

  if (authLoading) {
    return <AdminLoading />;
  }

  if (!isAdmin) {
    router.push('/planner');
    return null;
  }

  const courses = coursesData?.data ?? [];
  const departments = departmentsData?.data ?? [];
  const isSaving = isCreating || isUpdating;

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminHeader
        title="과목 관리"
        description={<>등록된 과목을 관리합니다. (총 {coursesData?.pagination.total ?? 0}건)</>}
        actions={<Button type="button" variant={showForm ? 'outline' : 'primary'} onClick={openCreateForm}><Plus aria-hidden="true" className="h-4 w-4" />과목 추가</Button>}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Input variant="search" aria-label="과목명 또는 코드 검색" className="pr-10"
            type="text"
            placeholder="과목명 또는 코드 검색"
            value={searchTerm}
            onChange={(e) => { setPage(1); setSearchTerm(e.target.value); }}
          />
          {searchTerm && (
            <Button aria-label="검색 지우기" variant="text"
              type="button"
              onClick={() => { setPage(1); setSearchTerm(''); }}
              size="icon" className="absolute right-0 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Select aria-label="학과"
          value={departmentFilter}
          onChange={(e) => { setPage(1); setDepartmentFilter(e.target.value); }}
        >
          <option value="">전체 학과</option>
          {departments.map((dept) => (
            <option key={dept._id} value={dept._id}>
              {dept.name}
            </option>
          ))}
        </Select>

        <Select aria-label="카테고리"
          value={categoryFilter}
          onChange={(e) => { setPage(1); setCategoryFilter(e.target.value as RequirementCategory | ''); }}
        >
          <option value="">전체 카테고리</option>
          {ALL_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </Select>

        <Select aria-label="기준 연도"
          value={yearFilter}
          onChange={(e) => { setPage(1); setYearFilter(Number(e.target.value)); }}
        >
          <option value={2025}>2025년</option>
          <option value={2026}>2026년</option>
        </Select>
      </div>

      {departmentsError && <div role="alert" className="text-[13px] text-ink-2">학과 목록을 불러오는데 실패했습니다. <Button variant="outline" onClick={() => retryDepartments()}>학과 다시 시도</Button></div>}
      <AdminPagination pagination={coursesData?.pagination} pending={isLoading} onPage={setPage} />
      {/* Loading */}
      {isLoading && <AdminLoading />}

      {/* Error */}
      {error && (
        <div role="alert" className="border-t border-line-2 py-8 text-[13px] text-ink-2">
          과목 목록을 불러오는데 실패했습니다.
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && courses.length === 0 && (
        <div className="border-t border-line-2 py-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-placeholder" />
          <p className="mt-4 text-sm text-ink-2">등록된 과목이 없습니다.</p>
        </div>
      )}

      {/* Course List */}
      {!isLoading && courses.length > 0 && (
        <div className="border-t border-line-2">
          {courses.map((course) => (
            <AdminRow key={course._id}>
              <div>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  {/* Course info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-ink">
                        {course.code}
                      </span>
                      <span className="text-sm font-medium text-ink">
                        {course.name}
                      </span>
                      <span className="inline-flex text-xs font-medium text-ink-2">
                        {course.credits}학점
                      </span>
                      {course.category && (
                        <CategoryLabel category={course.category} />
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-2">
                      {course.department && (
                        <span>{course.department.name}</span>
                      )}
                      {course.semesters.length > 0 && (
                        <span>
                          {course.semesters.map((s) => SEMESTER_LABELS[s]).join(', ')}
                        </span>
                      )}
                      {course.recommendedYear && (
                        <span>{course.recommendedYear}학년 권장</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button aria-label="수정" variant="text"
                      type="button"
                      onClick={() => openEditForm(course)}
                      size="icon"
                      title="수정"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {(
                      <Button aria-label="삭제" variant="textDanger"
                        type="button"
                        onClick={() => { formSession.begin(); setDeletingId(course._id); }}
                        size="icon"
                        title="삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </AdminRow>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <AdminDialog isPending={formSession.isPending} title={<>{editingCourse ? '과목 수정' : '과목 추가'}</>} onClose={closeForm} pending={isCreating || isUpdating}>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Code */}
              <div>
                <Input label="과목 코드 *"
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value }))}
                  placeholder="예: CSE1001"
                  required
                />
              </div>

              {/* Name */}
              <div>
                <Input label="과목명 *"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="예: 프로그래밍 기초"
                  required
                />
              </div>

              {/* Credits */}
              <div>
                <Input label="학점 *"
                  type="number"
                  min={1}
                  max={12}
                  value={formData.credits}
                  onChange={(e) => setFormData((p) => ({ ...p, credits: parseInt(e.target.value, 10) || 1 }))}
                  required
                />
              </div>

              {/* Department */}
              <div>
                <Select label="학과" required={!editingCourse} disabled={departmentsError}
                  value={formData.department}
                  onChange={(e) => setFormData((p) => ({ ...p, department: e.target.value }))}
                >
                  <option value="">학과 선택</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Category */}
              <div>
                <Select label="카테고리" required={!editingCourse}
                  value={formData.category}
                  onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value as RequirementCategory | '' }))}
                >
                  <option value="">카테고리 없음</option>
                  {ALL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </Select>
              </div>

              {!editingCourse && <>
                <Input label="교육과정 연도" type="number" required min={2020} max={2100} value={formData.curriculumYear} onChange={e => setFormData(p => ({ ...p, curriculumYear: Number(e.target.value) }))} />
                <Select label="권장 학기" value={formData.recommendedSemester} onChange={e => setFormData(p => ({ ...p, recommendedSemester: e.target.value as 'spring' | 'fall' }))}>
                  <option value="spring">1학기</option><option value="fall">2학기</option>
                </Select>
              </>}
              {/* Semesters */}
              <fieldset>
                <legend className="mb-2 text-[13px] font-semibold text-ink-2">개설 학기 *</legend>
                <div className="flex flex-wrap gap-2">
                  {ALL_SEMESTERS.map((sem) => (
                    <Button aria-pressed={formData.semesters.includes(sem)} className={formData.semesters.includes(sem) ? "border-primary text-primary" : undefined} variant="outline"
                      key={sem}
                      type="button"
                      onClick={() => toggleSemester(sem)}
                    >
                      {SEMESTER_LABELS[sem]}
                    </Button>
                  ))}
                </div>
              </fieldset>

              {/* Recommended Year */}
              <div>
                <Select label="권장 학년" required={!editingCourse}
                  value={formData.recommendedYear}
                  onChange={(e) => setFormData((p) => ({ ...p, recommendedYear: e.target.value }))}
                >
                  <option value="">선택 안 함</option>
                  <option value="1">1학년</option>
                  <option value="2">2학년</option>
                  <option value="3">3학년</option>
                  <option value="4">4학년</option>
                </Select>
              </div>

              {/* Description */}
              <div>
                <Textarea label="설명"
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  placeholder="과목에 대한 설명을 입력하세요"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="text"
                  type="button"
                  onClick={closeForm}
                >
                  취소
                </Button>
                <Button variant="primary"
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving ? '저장 중...' : editingCourse ? '수정' : '추가'}
                </Button>
              </div>
            </form>
        </AdminDialog>
      )}
      {deletingId && <AdminConfirmDialog isPending={formSession.isPending} title="과목 삭제" description="정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다." onClose={() => setDeletingId(null)} onConfirm={() => { if (!isDeleting) deleteCourse(deletingId); }} pending={isDeleting} />}
    </div>
  );
}
