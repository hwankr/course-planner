'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToastStore } from '@/stores/toastStore';
import { Card, CardContent } from '@/components/ui';
import { ArrowLeft, Plus, Pencil, Trash2, Search, X, BookOpen } from 'lucide-react';
import Link from 'next/link';
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

interface CourseFormData {
  code: string;
  name: string;
  credits: number;
  department: string;
  category: RequirementCategory | '';
  semesters: Semester[];
  recommendedYear: string;
  description: string;
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

const CATEGORY_COLORS: Record<RequirementCategory, string> = {
  major_required: 'bg-red-100 text-red-700',
  major_compulsory: 'bg-orange-100 text-orange-700',
  major_elective: 'bg-blue-100 text-blue-700',
  general_required: 'bg-green-100 text-green-700',
  general_elective: 'bg-teal-100 text-teal-700',
  free_elective: 'bg-gray-100 text-gray-700',
  teaching: 'bg-purple-100 text-purple-700',
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
  recommendedYear: '',
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

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<RequirementCategory | ''>('');

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
    return params.toString();
  };

  const { data: coursesData, isLoading, error } = useQuery<{ success: boolean; data: CourseItem[] }>({
    queryKey: ['admin-courses', searchTerm, departmentFilter, categoryFilter],
    queryFn: async () => {
      const qs = buildQueryString();
      const res = await fetch(`/api/courses${qs ? `?${qs}` : ''}`);
      if (!res.ok) throw new Error('과목 목록을 불러오는데 실패했습니다.');
      return res.json();
    },
    enabled: isAdmin && !authLoading,
  });

  const { data: departmentsData } = useQuery<{ success: boolean; data: DepartmentItem[] }>({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await fetch('/api/departments');
      if (!res.ok) throw new Error('학과 목록을 불러오는데 실패했습니다.');
      return res.json();
    },
    enabled: isAdmin && !authLoading,
  });

  // ---- Mutations ----

  const { mutate: createCourse, isPending: isCreating } = useMutation({
    mutationFn: async (data: CourseFormData) => {
      const body: Record<string, unknown> = {
        code: data.code.toUpperCase(),
        name: data.name,
        credits: data.credits,
        semesters: data.semesters,
      };
      if (data.department) body.department = data.department;
      if (data.category) body.category = data.category;
      if (data.recommendedYear) body.recommendedYear = parseInt(data.recommendedYear, 10);
      if (data.description.trim()) body.description = data.description.trim();

      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || '과목 생성에 실패했습니다.');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      addToast({ type: 'success', message: '과목이 생성되었습니다.' });
      closeForm();
    },
    onError: (err: Error) => {
      addToast({ type: 'warning', message: err.message });
    },
  });

  const { mutate: updateCourse, isPending: isUpdating } = useMutation({
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      addToast({ type: 'success', message: '과목이 수정되었습니다.' });
      closeForm();
    },
    onError: (err: Error) => {
      addToast({ type: 'warning', message: err.message });
    },
  });

  const { mutate: deleteCourse } = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/courses/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || '과목 삭제에 실패했습니다.');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      addToast({ type: 'success', message: '과목이 삭제되었습니다.' });
      setDeletingId(null);
    },
    onError: (err: Error) => {
      addToast({ type: 'warning', message: err.message });
      setDeletingId(null);
    },
  });

  // ---- Handlers ----

  const openCreateForm = () => {
    setEditingCourse(null);
    setFormData(EMPTY_FORM);
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
      recommendedYear: course.recommendedYear?.toString() || '',
      description: course.description || '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCourse(null);
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim() || formData.semesters.length === 0) {
      addToast({ type: 'warning', message: '과목 코드, 과목명, 개설 학기는 필수입니다.' });
      return;
    }
    if (editingCourse) {
      updateCourse({ id: editingCourse._id, data: formData });
    } else {
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
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
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
      <div>
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#00AACA] transition-colors hover:text-[#153974]"
        >
          <ArrowLeft className="h-4 w-4" />
          관리자 대시보드로 돌아가기
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">과목 관리</h1>
            <p className="mt-1 text-gray-600">
              등록된 과목을 관리합니다. ({courses.length}건)
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 rounded-lg bg-[#00AACA] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#153974] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            과목 추가
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="과목명 또는 코드 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm text-slate-700 focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
        >
          <option value="">전체 학과</option>
          {departments.map((dept) => (
            <option key={dept._id} value={dept._id}>
              {dept.name}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as RequirementCategory | '')}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
        >
          <option value="">전체 카테고리</option>
          {ALL_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
          과목 목록을 불러오는데 실패했습니다.
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && courses.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm text-slate-500">등록된 과목이 없습니다.</p>
        </div>
      )}

      {/* Course List */}
      {!isLoading && courses.length > 0 && (
        <div className="space-y-3">
          {courses.map((course) => (
            <Card key={course._id} className="overflow-hidden">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  {/* Course info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">
                        {course.code}
                      </span>
                      <span className="text-sm font-medium text-slate-700">
                        {course.name}
                      </span>
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {course.credits}학점
                      </span>
                      {course.category && (
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[course.category]}`}>
                          {CATEGORY_LABELS[course.category]}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
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
                    <button
                      type="button"
                      onClick={() => openEditForm(course)}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                      title="수정"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    {deletingId === course._id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => deleteCourse(course._id)}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 cursor-pointer"
                        >
                          삭제
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(null)}
                          className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-300 cursor-pointer"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeletingId(course._id)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 cursor-pointer"
                        title="삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {editingCourse ? '과목 수정' : '과목 추가'}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Code */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  과목 코드 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value }))}
                  placeholder="예: CSE1001"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 uppercase focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
                  required
                />
              </div>

              {/* Name */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  과목명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="예: 프로그래밍 기초"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
                  required
                />
              </div>

              {/* Credits */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  학점 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={formData.credits}
                  onChange={(e) => setFormData((p) => ({ ...p, credits: parseInt(e.target.value, 10) || 1 }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
                  required
                />
              </div>

              {/* Department */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">학과</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData((p) => ({ ...p, department: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
                >
                  <option value="">학과 없음 (공통)</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">카테고리</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value as RequirementCategory | '' }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
                >
                  <option value="">카테고리 없음</option>
                  {ALL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Semesters */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  개설 학기 <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_SEMESTERS.map((sem) => (
                    <button
                      key={sem}
                      type="button"
                      onClick={() => toggleSemester(sem)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                        formData.semesters.includes(sem)
                          ? 'bg-[#00AACA] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {SEMESTER_LABELS[sem]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recommended Year */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">권장 학년</label>
                <select
                  value={formData.recommendedYear}
                  onChange={(e) => setFormData((p) => ({ ...p, recommendedYear: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
                >
                  <option value="">선택 안 함</option>
                  <option value="1">1학년</option>
                  <option value="2">2학년</option>
                  <option value="3">3학년</option>
                  <option value="4">4학년</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  placeholder="과목에 대한 설명을 입력하세요"
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-300 cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-[#00AACA] px-4 py-2 text-sm font-medium text-white hover:bg-[#153974] disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? '저장 중...' : editingCourse ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
