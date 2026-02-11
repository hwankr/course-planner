'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToastStore } from '@/stores/toastStore';
import { Card, CardContent } from '@/components/ui';
import { ArrowLeft, Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import Link from 'next/link';

interface Department {
  _id: string;
  code: string;
  name: string;
  college?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DepartmentForm {
  code: string;
  name: string;
  college: string;
}

const EMPTY_FORM: DepartmentForm = { code: '', name: '', college: '' };

export default function AdminDepartmentsPage() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const addToast = useToastStore((s) => s.addToast);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DepartmentForm>(EMPTY_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<{ success: boolean; data: Department[] }>({
    queryKey: ['admin-departments'],
    queryFn: async () => {
      const res = await fetch('/api/departments');
      if (!res.ok) throw new Error('학과 목록을 불러오는데 실패했습니다.');
      return res.json();
    },
    enabled: isAdmin && !authLoading,
  });

  const { mutate: createDepartment, isPending: isCreating } = useMutation({
    mutationFn: async (input: DepartmentForm) => {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '학과 생성에 실패했습니다.');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-departments'] });
      addToast({ type: 'success', message: '학과가 생성되었습니다.' });
      closeForm();
    },
    onError: (error: Error) => {
      addToast({ type: 'warning', message: error.message });
    },
  });

  const { mutate: updateDepartment, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<DepartmentForm> }) => {
      const res = await fetch(`/api/departments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '학과 수정에 실패했습니다.');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-departments'] });
      addToast({ type: 'success', message: '학과가 수정되었습니다.' });
      closeForm();
    },
    onError: (error: Error) => {
      addToast({ type: 'warning', message: error.message });
    },
  });

  const { mutate: deleteDepartment } = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/departments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('학과 삭제에 실패했습니다.');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-departments'] });
      addToast({ type: 'success', message: '학과가 삭제되었습니다.' });
      setDeleteConfirmId(null);
    },
    onError: (error: Error) => {
      addToast({ type: 'warning', message: error.message });
      setDeleteConfirmId(null);
    },
  });

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

  const departments = data?.data ?? [];
  const searchLower = search.toLowerCase();
  const filtered = search
    ? departments.filter(
        (d) =>
          d.name.toLowerCase().includes(searchLower) ||
          d.code.toLowerCase().includes(searchLower)
      )
    : departments;

  function openCreateForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEditForm(dept: Department) {
    setEditingId(dept._id);
    setForm({ code: dept.code, name: dept.name, college: dept.college || '' });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      addToast({ type: 'warning', message: '학과 코드와 이름은 필수입니다.' });
      return;
    }

    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      college: form.college.trim() || undefined,
    };

    if (editingId) {
      updateDepartment({ id: editingId, input: payload });
    } else {
      createDepartment(payload as DepartmentForm);
    }
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
        <h1 className="text-2xl font-bold text-gray-900">학과 관리</h1>
        <p className="mt-1 text-gray-600">
          학과를 추가, 수정, 삭제할 수 있습니다. ({filtered.length}건)
        </p>
      </div>

      {/* Filters + Add Button */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="학과명 또는 코드로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-9 text-sm text-slate-700 focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 rounded-lg bg-[#00AACA] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#153974] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          학과 추가
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
          학과 목록을 불러오는데 실패했습니다.
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Search className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm text-slate-500">
            {search ? '검색 결과가 없습니다.' : '등록된 학과가 없습니다.'}
          </p>
        </div>
      )}

      {/* Department List */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((dept) => (
            <Card key={dept._id} className="overflow-hidden">
              <CardContent className="flex items-center justify-between p-4 sm:p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                      {dept.code}
                    </span>
                    <span className="text-sm font-medium text-slate-900">{dept.name}</span>
                  </div>
                  {dept.college && (
                    <p className="mt-1 text-xs text-slate-400">{dept.college}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditForm(dept)}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                    title="수정"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(dept._id)}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 cursor-pointer"
                    title="삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">
              {editingId ? '학과 수정' : '학과 추가'}
            </h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  학과 코드 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                  placeholder="예: CSE"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  학과명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="예: 컴퓨터공학과"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  단과대학
                </label>
                <input
                  type="text"
                  value={form.college}
                  onChange={(e) => setForm((prev) => ({ ...prev, college: e.target.value }))}
                  placeholder="예: 공과대학"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 cursor-pointer"
                  disabled={isSaving}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-[#00AACA] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#153974] disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? '저장 중...' : editingId ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">학과 삭제</h2>
            <p className="mt-2 text-sm text-slate-600">
              정말로 이 학과를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => deleteDepartment(deleteConfirmId)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 cursor-pointer"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
