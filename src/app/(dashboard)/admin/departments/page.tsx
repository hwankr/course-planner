'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdminMutation, useAdminFormSession } from '../_components/useAdminMutation';
import { invalidateAdminData } from '../_components/adminCache';
import { useAuth } from '@/hooks/useAuth';
import { useToastStore } from '@/stores/toastStore';
import { Button, Input, Select } from '@/components/ui';
import { AdminHeader, AdminRow, AdminLoading } from '../_components/AdminParts';
import { AdminDialog } from '../_components/AdminDialog';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';

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
  const formSession = useAdminFormSession();

  const [search, setSearch] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');
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

  const { mutate: createDepartment, isPending: isCreating } = useAdminMutation({
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
    onSuccess: (_result, _variables, sessionId) => {
      void invalidateAdminData(queryClient, 'departments');
      addToast({ type: 'success', message: '학과가 생성되었습니다.' });
      if (formSession.isCurrent(sessionId)) closeForm();
    },
    onError: (error: Error) => {
      addToast({ type: 'warning', message: error.message });
    },
  }, formSession);

  const { mutate: updateDepartment, isPending: isUpdating } = useAdminMutation({
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
    onSuccess: (_result, _variables, sessionId) => {
      void invalidateAdminData(queryClient, 'departments');
      addToast({ type: 'success', message: '학과가 수정되었습니다.' });
      if (formSession.isCurrent(sessionId)) closeForm();
    },
    onError: (error: Error) => {
      addToast({ type: 'warning', message: error.message });
    },
  }, formSession);

  const { mutate: deleteDepartment, isPending: isDeleting } = useAdminMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/departments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('학과 삭제에 실패했습니다.');
      return res.json();
    },
    onSuccess: (_result, _variables, sessionId) => {
      void invalidateAdminData(queryClient, 'departments');
      addToast({ type: 'success', message: '학과가 삭제되었습니다.' });
      if (formSession.isCurrent(sessionId)) setDeleteConfirmId(null);
    },
    onError: (error: Error, _variables, sessionId) => {
      addToast({ type: 'warning', message: error.message });
      if (formSession.isCurrent(sessionId)) setDeleteConfirmId(null);
    },
  }, formSession);

  // Auth guard - render early returns AFTER all hooks
  if (authLoading) {
    return <AdminLoading />;
  }

  if (!isAdmin) {
    router.push('/planner');
    return null;
  }

  const departments = data?.data ?? [];
  const searchLower = search.toLowerCase();
  const colleges = [...new Set(departments.map(d => d.college).filter((college): college is string => !!college))].sort();
  const filtered = departments.filter(d => (!collegeFilter || d.college === collegeFilter) &&
    (!search || d.name.toLowerCase().includes(searchLower) || d.code.toLowerCase().includes(searchLower)));


  function openCreateForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    formSession.begin();
    setShowForm(true);
  }

  function openEditForm(dept: Department) {
    setEditingId(dept._id);
    setForm({ code: dept.code, name: dept.name, college: dept.college || '' });
    formSession.begin();
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isCreating || isUpdating) return;
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
      <AdminHeader
        title="학과 관리"
        description={<>학과를 추가, 수정, 삭제할 수 있습니다. ({filtered.length}건)</>}
        actions={<Button type="button" variant={showForm ? 'outline' : 'primary'} onClick={openCreateForm}><Plus aria-hidden="true" className="h-4 w-4" />학과 추가</Button>}
      />

      <Select aria-label="대학" value={collegeFilter} onChange={e => setCollegeFilter(e.target.value)}>
        <option value="">전체 대학</option>
        {colleges.map(college => <option key={college} value={college}>{college}</option>)}
      </Select>
      {/* Filters + Add Button */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Input variant="search" aria-label="학과명 또는 코드로 검색..." className="pr-10"
            type="text"
            placeholder="학과명 또는 코드로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <Button aria-label="검색 지우기" variant="text"
              type="button"
              onClick={() => setSearch('')}
              size="icon" className="absolute right-0 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && <AdminLoading />}

      {/* Error */}
      {error && (
        <div role="alert" className="border-t border-line-2 py-8 text-[13px] text-ink-2">
          학과 목록을 불러오는데 실패했습니다.
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="border-t border-line-2 py-12 text-center">
          <Search className="mx-auto h-12 w-12 text-placeholder" />
          <p className="mt-4 text-sm text-ink-2">
            {search ? '검색 결과가 없습니다.' : '등록된 학과가 없습니다.'}
          </p>
        </div>
      )}

      {/* Department List */}
      {!isLoading && filtered.length > 0 && (
        <div className="border-t border-line-2">
          {filtered.map((dept) => (
            <AdminRow key={dept._id}>
              <div className="flex items-center justify-between ">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex text-xs font-semibold text-ink-2">
                      {dept.code}
                    </span>
                    <span className="text-sm font-medium text-ink">{dept.name}</span>
                  </div>
                  {dept.college && (
                    <p className="mt-1 text-xs text-ink-2">{dept.college}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <Button aria-label="수정" variant="text"
                    type="button"
                    onClick={() => openEditForm(dept)}
                    size="icon"
                    title="수정"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button aria-label="삭제" variant="textDanger"
                    type="button"
                    onClick={() => { formSession.begin(); setDeleteConfirmId(dept._id); }}
                    size="icon"
                    title="삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </AdminRow>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <AdminDialog isPending={formSession.isPending} title={<>{editingId ? '학과 수정' : '학과 추가'}</>} onClose={closeForm} pending={isCreating || isUpdating}>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <Input label="학과 코드 *"
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                  placeholder="예: CSE"
                  required
                />
              </div>
              <div>
                <Input label="학과명 *"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="예: 컴퓨터공학과"
                  required
                />
              </div>
              <div>
                <Input label="단과대학"
                  type="text"
                  value={form.college}
                  onChange={(e) => setForm((prev) => ({ ...prev, college: e.target.value }))}
                  placeholder="예: 공과대학"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="text"
                  type="button"
                  onClick={closeForm}
                  disabled={isSaving}
                >
                  취소
                </Button>
                <Button variant="primary"
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving ? '저장 중...' : editingId ? '수정' : '추가'}
                </Button>
              </div>
            </form>
        </AdminDialog>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <AdminDialog isPending={formSession.isPending} title={<>학과 삭제</>} onClose={() => setDeleteConfirmId(null)} pending={isDeleting}>
            <p className="mt-2 text-sm text-ink-2">
              정말로 이 학과를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="mt-4 flex items-center justify-end gap-3">
              <Button variant="text"
                type="button"
                disabled={isDeleting} onClick={() => { if (!formSession.isPending()) setDeleteConfirmId(null); }}
              >
                취소
              </Button>
              <Button variant="textDanger"
                type="button"
                disabled={isDeleting}
                onClick={() => { if (!isDeleting) deleteDepartment(deleteConfirmId); }}
              >
                삭제
              </Button>
            </div>
        </AdminDialog>
      )}
    </div>
  );
}
