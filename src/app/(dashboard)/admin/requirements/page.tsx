'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToastStore } from '@/stores/toastStore';
import { Card, CardContent } from '@/components/ui';
import { ArrowLeft, Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import Link from 'next/link';

interface MajorConfig {
  majorRequiredMin: number | null;
  majorCredits: number | null;
}

interface MinorConfig extends MajorConfig {
  primaryMajorMin: number | null;
}

interface RequirementItem {
  _id: string;
  college: string;
  departmentName: string;
  generalCredits: number | null;
  single: MajorConfig;
  double: MajorConfig;
  minor: MinorConfig;
  totalCredits: number;
  availableMajorTypes: string[];
}

interface FormData {
  college: string;
  departmentName: string;
  totalCredits: number | '';
  generalCredits: number | '' | null;
  noGeneral: boolean;
  single: { majorRequiredMin: number | '' | null; majorCredits: number | '' | null };
  double: { majorRequiredMin: number | '' | null; majorCredits: number | '' | null };
  minor: { majorRequiredMin: number | '' | null; majorCredits: number | '' | null; primaryMajorMin: number | '' | null };
}

const initialForm: FormData = {
  college: '',
  departmentName: '',
  totalCredits: '',
  generalCredits: '',
  noGeneral: false,
  single: { majorRequiredMin: '', majorCredits: '' },
  double: { majorRequiredMin: '', majorCredits: '' },
  minor: { majorRequiredMin: '', majorCredits: '', primaryMajorMin: '' },
};

function numOrNull(val: number | '' | null): number | null {
  if (val === '' || val === null) return null;
  return val;
}

function displayNum(val: number | null): string {
  return val !== null ? String(val) : '-';
}

export default function AdminRequirementsPage() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const addToast = useToastStore((s) => s.addToast);
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(initialForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<{ success: boolean; data: RequirementItem[] }>({
    queryKey: ['admin-requirements'],
    queryFn: async () => {
      const res = await fetch('/api/admin/requirements');
      if (!res.ok) throw new Error('졸업요건 목록을 불러오는데 실패했습니다.');
      return res.json();
    },
    enabled: isAdmin && !authLoading,
  });

  const { mutate: createRequirement, isPending: isCreating } = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch('/api/admin/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '생성에 실패했습니다.');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-requirements'] });
      addToast({ type: 'success', message: '졸업요건이 생성되었습니다.' });
      closeForm();
    },
    onError: (err: Error) => {
      addToast({ type: 'warning', message: err.message });
    },
  });

  const { mutate: updateRequirement, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      const res = await fetch(`/api/admin/requirements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '수정에 실패했습니다.');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-requirements'] });
      addToast({ type: 'success', message: '졸업요건이 수정되었습니다.' });
      closeForm();
    },
    onError: (err: Error) => {
      addToast({ type: 'warning', message: err.message });
    },
  });

  const { mutate: deleteRequirement } = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/requirements/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '삭제에 실패했습니다.');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-requirements'] });
      addToast({ type: 'success', message: '졸업요건이 삭제되었습니다.' });
      setDeleteConfirmId(null);
    },
    onError: (err: Error) => {
      addToast({ type: 'warning', message: err.message });
      setDeleteConfirmId(null);
    },
  });

  const requirements = data?.data ?? [];

  const colleges = useMemo(() => {
    const set = new Set(requirements.map((r) => r.college));
    return Array.from(set).sort();
  }, [requirements]);

  const filtered = useMemo(() => {
    return requirements.filter((r) => {
      if (collegeFilter && r.college !== collegeFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!r.departmentName.toLowerCase().includes(q) && !r.college.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [requirements, collegeFilter, searchQuery]);

  const grouped = useMemo(() => {
    const map = new Map<string, RequirementItem[]>();
    for (const r of filtered) {
      const list = map.get(r.college) || [];
      list.push(r);
      map.set(r.college, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(initialForm);
  }

  function openCreate() {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(item: RequirementItem) {
    setForm({
      college: item.college,
      departmentName: item.departmentName,
      totalCredits: item.totalCredits,
      generalCredits: item.generalCredits ?? '',
      noGeneral: item.generalCredits === null,
      single: {
        majorRequiredMin: item.single.majorRequiredMin ?? '',
        majorCredits: item.single.majorCredits ?? '',
      },
      double: {
        majorRequiredMin: item.double.majorRequiredMin ?? '',
        majorCredits: item.double.majorCredits ?? '',
      },
      minor: {
        majorRequiredMin: item.minor.majorRequiredMin ?? '',
        majorCredits: item.minor.majorCredits ?? '',
        primaryMajorMin: item.minor.primaryMajorMin ?? '',
      },
    });
    setEditingId(item._id);
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = {
      college: form.college,
      departmentName: form.departmentName,
      totalCredits: Number(form.totalCredits) || 0,
      generalCredits: form.noGeneral ? null : (Number(form.generalCredits) || null),
      single: {
        majorRequiredMin: numOrNull(form.single.majorRequiredMin),
        majorCredits: numOrNull(form.single.majorCredits),
      },
      double: {
        majorRequiredMin: numOrNull(form.double.majorRequiredMin),
        majorCredits: numOrNull(form.double.majorCredits),
      },
      minor: {
        majorRequiredMin: numOrNull(form.minor.majorRequiredMin),
        majorCredits: numOrNull(form.minor.majorCredits),
        primaryMajorMin: numOrNull(form.minor.primaryMajorMin),
      },
    };

    if (editingId) {
      updateRequirement({ id: editingId, body });
    } else {
      createRequirement(body);
    }
  }

  // Auth guard - render early returns AFTER all hooks
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
            <h1 className="text-2xl font-bold text-gray-900">졸업 요건 관리</h1>
            <p className="mt-1 text-gray-600">
              학과별 졸업 요건을 관리합니다. ({filtered.length}건)
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-[#153974] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a4a94] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            추가
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="학과명 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-9 text-sm text-slate-700 focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <select
          value={collegeFilter}
          onChange={(e) => setCollegeFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
        >
          <option value="">전체 대학</option>
          {colleges.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeForm}>
          <div
            className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-bold text-gray-900">
              {editingId ? '졸업요건 수정' : '졸업요건 추가'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">대학 *</label>
                  <input
                    type="text"
                    required
                    value={form.college}
                    onChange={(e) => setForm({ ...form, college: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
                    placeholder="공과대학"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">학과명 *</label>
                  <input
                    type="text"
                    required
                    value={form.departmentName}
                    onChange={(e) => setForm({ ...form, departmentName: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
                    placeholder="건축학부 건축학전공"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">졸업학점 *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.totalCredits}
                    onChange={(e) => setForm({ ...form, totalCredits: e.target.value ? Number(e.target.value) : '' })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">교양학점</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      disabled={form.noGeneral}
                      value={form.noGeneral ? '' : (form.generalCredits ?? '')}
                      onChange={(e) => setForm({ ...form, generalCredits: e.target.value ? Number(e.target.value) : '' })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20 disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </div>
                  <label className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <input
                      type="checkbox"
                      checked={form.noGeneral}
                      onChange={(e) => setForm({ ...form, noGeneral: e.target.checked, generalCredits: e.target.checked ? null : '' })}
                      className="rounded"
                    />
                    교양 없음
                  </label>
                </div>
              </div>

              {/* Single Major */}
              <fieldset className="rounded-lg border border-slate-200 p-3">
                <legend className="px-2 text-xs font-semibold text-slate-600">단일전공</legend>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">전공핵심 최소</label>
                    <input
                      type="number"
                      min={0}
                      value={form.single.majorRequiredMin ?? ''}
                      onChange={(e) => setForm({ ...form, single: { ...form.single, majorRequiredMin: e.target.value ? Number(e.target.value) : '' } })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">전공계</label>
                    <input
                      type="number"
                      min={0}
                      value={form.single.majorCredits ?? ''}
                      onChange={(e) => setForm({ ...form, single: { ...form.single, majorCredits: e.target.value ? Number(e.target.value) : '' } })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
                    />
                  </div>
                </div>
              </fieldset>

              {/* Double Major */}
              <fieldset className="rounded-lg border border-slate-200 p-3">
                <legend className="px-2 text-xs font-semibold text-slate-600">복수전공</legend>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">전공핵심 최소</label>
                    <input
                      type="number"
                      min={0}
                      value={form.double.majorRequiredMin ?? ''}
                      onChange={(e) => setForm({ ...form, double: { ...form.double, majorRequiredMin: e.target.value ? Number(e.target.value) : '' } })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">전공계</label>
                    <input
                      type="number"
                      min={0}
                      value={form.double.majorCredits ?? ''}
                      onChange={(e) => setForm({ ...form, double: { ...form.double, majorCredits: e.target.value ? Number(e.target.value) : '' } })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
                    />
                  </div>
                </div>
              </fieldset>

              {/* Minor */}
              <fieldset className="rounded-lg border border-slate-200 p-3">
                <legend className="px-2 text-xs font-semibold text-slate-600">부전공</legend>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">전공핵심 최소</label>
                    <input
                      type="number"
                      min={0}
                      value={form.minor.majorRequiredMin ?? ''}
                      onChange={(e) => setForm({ ...form, minor: { ...form.minor, majorRequiredMin: e.target.value ? Number(e.target.value) : '' } })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">전공계</label>
                    <input
                      type="number"
                      min={0}
                      value={form.minor.majorCredits ?? ''}
                      onChange={(e) => setForm({ ...form, minor: { ...form.minor, majorCredits: e.target.value ? Number(e.target.value) : '' } })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="mb-1 block text-xs text-slate-500">부전공 시 주전공 최소</label>
                  <input
                    type="number"
                    min={0}
                    value={form.minor.primaryMajorMin ?? ''}
                    onChange={(e) => setForm({ ...form, minor: { ...form.minor, primaryMajorMin: e.target.value ? Number(e.target.value) : '' } })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
                  />
                </div>
              </fieldset>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-[#153974] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a4a94] disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? '저장 중...' : editingId ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteConfirmId(null)}>
          <div
            className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900">삭제 확인</h3>
            <p className="mt-2 text-sm text-slate-600">이 졸업요건을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => deleteRequirement(deleteConfirmId)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 cursor-pointer"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
          졸업요건 목록을 불러오는데 실패했습니다.
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="mt-4 text-sm text-slate-500">
            {searchQuery || collegeFilter ? '검색 결과가 없습니다.' : '등록된 졸업요건이 없습니다.'}
          </p>
        </div>
      )}

      {/* Requirement List - Grouped by College */}
      {!isLoading && grouped.length > 0 && (
        <div className="space-y-6">
          {grouped.map(([college, items]) => (
            <div key={college}>
              <h2 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">
                {college} ({items.length})
              </h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <Card key={item._id} className="overflow-hidden">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900">{item.departmentName}</h3>
                          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                            <span>졸업학점: <strong>{item.totalCredits}</strong></span>
                            <span>교양: <strong>{displayNum(item.generalCredits)}</strong></span>
                          </div>
                          <div className="mt-2 space-y-0.5 text-xs text-slate-500">
                            <p>
                              단일전공: 핵심 {displayNum(item.single.majorRequiredMin)} / 전공 {displayNum(item.single.majorCredits)}
                            </p>
                            <p>
                              복수전공: 핵심 {displayNum(item.double.majorRequiredMin)} / 전공 {displayNum(item.double.majorCredits)}
                            </p>
                            <p>
                              부전공: 핵심 {displayNum(item.minor.majorRequiredMin)} / 전공 {displayNum(item.minor.majorCredits)}
                              {item.minor.primaryMajorMin !== null && ` (주전공 최소 ${item.minor.primaryMajorMin})`}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                            title="수정"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(item._id)}
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 cursor-pointer"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
