'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdminMutation, useAdminFormSession } from '../_components/useAdminMutation';
import { invalidateAdminData } from '../_components/adminCache';
import { useAuth } from '@/hooks/useAuth';
import { useToastStore } from '@/stores/toastStore';
import { Button, Input, Select } from '@/components/ui';
import { AdminHeader, AdminRow, AdminLoading } from '../_components/AdminParts';
import { AdminDialog } from '../_components/AdminDialog';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { DEFAULT_REQUIREMENT_YEAR } from '@/lib/constants';

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
  year: number;
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
  year: number;
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
  year: 2025,
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
  const formSession = useAdminFormSession();

  const [searchQuery, setSearchQuery] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [yearFilter, setYearFilter] = useState<number | ''>(DEFAULT_REQUIREMENT_YEAR);
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

  const { mutate: createRequirement, isPending: isCreating } = useAdminMutation({
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
    onSuccess: (_result, _variables, sessionId) => {
      void invalidateAdminData(queryClient, 'requirements');
      addToast({ type: 'success', message: '졸업요건이 생성되었습니다.' });
      if (formSession.isCurrent(sessionId)) closeForm();
    },
    onError: (err: Error) => {
      addToast({ type: 'warning', message: err.message });
    },
  }, formSession);

  const { mutate: updateRequirement, isPending: isUpdating } = useAdminMutation({
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
    onSuccess: (_result, _variables, sessionId) => {
      void invalidateAdminData(queryClient, 'requirements');
      addToast({ type: 'success', message: '졸업요건이 수정되었습니다.' });
      if (formSession.isCurrent(sessionId)) closeForm();
    },
    onError: (err: Error) => {
      addToast({ type: 'warning', message: err.message });
    },
  }, formSession);

  const { mutate: deleteRequirement, isPending: isDeleting } = useAdminMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/requirements/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '삭제에 실패했습니다.');
      }
      return res.json();
    },
    onSuccess: (_result, _variables, sessionId) => {
      void invalidateAdminData(queryClient, 'requirements');
      addToast({ type: 'success', message: '졸업요건이 삭제되었습니다.' });
      if (formSession.isCurrent(sessionId)) setDeleteConfirmId(null);
    },
    onError: (err: Error, _variables, sessionId) => {
      addToast({ type: 'warning', message: err.message });
      if (formSession.isCurrent(sessionId)) setDeleteConfirmId(null);
    },
  }, formSession);

  const requirements = useMemo(() => data?.data ?? [], [data?.data]);

  const colleges = useMemo(() => {
    const set = new Set(requirements.map((r) => r.college));
    return Array.from(set).sort();
  }, [requirements]);

  const filtered = useMemo(() => {
    return requirements.filter((r) => {
      if (yearFilter && r.year !== yearFilter) return false;
      if (collegeFilter && r.college !== collegeFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!r.departmentName.toLowerCase().includes(q) && !r.college.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [requirements, yearFilter, collegeFilter, searchQuery]);

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
    formSession.begin();
    setShowForm(true);
  }

  function openEdit(item: RequirementItem) {
    setForm({
      college: item.college,
      departmentName: item.departmentName,
      year: item.year,
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
    formSession.begin();
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isCreating || isUpdating) return;
    const body = {
      college: form.college,
      departmentName: form.departmentName,
      year: form.year,
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
    return <AdminLoading />;
  }

  if (!isAdmin) {
    router.push('/planner');
    return null;
  }

  const isSaving = isCreating || isUpdating;

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminHeader
        title="졸업 요건 관리"
        description={<>학과별 졸업 요건을 관리합니다. ({filtered.length}건)</>}
        actions={<Button type="button" variant={showForm ? 'outline' : 'primary'} onClick={openCreate}><Plus aria-hidden="true" className="h-4 w-4" />추가</Button>}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Input variant="search" aria-label="학과명 검색..." className="pr-10"
            type="text"
            placeholder="학과명 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button aria-label="검색 지우기" variant="text"
              type="button"
              onClick={() => setSearchQuery('')}
              size="icon" className="absolute right-0 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Select aria-label="대학"
          value={collegeFilter}
          onChange={(e) => setCollegeFilter(e.target.value)}
        >
          <option value="">전체 대학</option>
          {colleges.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Select aria-label="기준 연도"
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">전체 연도</option>
          <option value={2025}>2025년</option>
          <option value={2026}>2026년</option>
        </Select>
      </div>

      {/* Form Modal */}
      {showForm && (
        <AdminDialog isPending={formSession.isPending} title={<>{editingId ? '졸업요건 수정' : '졸업요건 추가'}</>} onClose={closeForm} pending={isCreating || isUpdating}>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input label="대학 *"
                    type="text"
                    required
                    value={form.college}
                    onChange={(e) => setForm({ ...form, college: e.target.value })}
                    placeholder="공과대학"
                  />
                </div>
                <div>
                  <Input label="학과명 *"
                    type="text"
                    required
                    value={form.departmentName}
                    onChange={(e) => setForm({ ...form, departmentName: e.target.value })}
                    placeholder="건축학부 건축학전공"
                  />
                </div>
              </div>

              <div>
                <Select label="적용 연도 *"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input label="졸업학점 *"
                    type="number"
                    required
                    min={1}
                    value={form.totalCredits}
                    onChange={(e) => setForm({ ...form, totalCredits: e.target.value ? Number(e.target.value) : '' })}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Input label="교양학점"
                      type="number"
                      min={0}
                      disabled={form.noGeneral}
                      value={form.noGeneral ? '' : (form.generalCredits ?? '')}
                      onChange={(e) => setForm({ ...form, generalCredits: e.target.value ? Number(e.target.value) : '' })}
                    />
                  </div>
                  <label className="mt-1 flex items-center gap-1.5 text-xs text-ink-2">
                    <input
                      type="checkbox"
                      checked={form.noGeneral}
                      onChange={(e) => setForm({ ...form, noGeneral: e.target.checked, generalCredits: e.target.checked ? null : '' })}
                      className="rounded-none"
                    />
                    교양 없음
                  </label>
                </div>
              </div>

              {/* Single Major */}
              <fieldset className="border-t border-line-2 py-3">
                <legend className="pr-3 text-[13px] font-semibold text-ink-2">단일전공</legend>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Input label="전공핵심 최소"
                      type="number"
                      min={0}
                      value={form.single.majorRequiredMin ?? ''}
                      onChange={(e) => setForm({ ...form, single: { ...form.single, majorRequiredMin: e.target.value ? Number(e.target.value) : '' } })}
                    />
                  </div>
                  <div>
                    <Input label="전공계"
                      type="number"
                      min={0}
                      value={form.single.majorCredits ?? ''}
                      onChange={(e) => setForm({ ...form, single: { ...form.single, majorCredits: e.target.value ? Number(e.target.value) : '' } })}
                    />
                  </div>
                </div>
              </fieldset>

              {/* Double Major */}
              <fieldset className="border-t border-line-2 py-3">
                <legend className="pr-3 text-[13px] font-semibold text-ink-2">복수전공</legend>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Input label="전공핵심 최소"
                      type="number"
                      min={0}
                      value={form.double.majorRequiredMin ?? ''}
                      onChange={(e) => setForm({ ...form, double: { ...form.double, majorRequiredMin: e.target.value ? Number(e.target.value) : '' } })}
                    />
                  </div>
                  <div>
                    <Input label="전공계"
                      type="number"
                      min={0}
                      value={form.double.majorCredits ?? ''}
                      onChange={(e) => setForm({ ...form, double: { ...form.double, majorCredits: e.target.value ? Number(e.target.value) : '' } })}
                    />
                  </div>
                </div>
              </fieldset>

              {/* Minor */}
              <fieldset className="border-t border-line-2 py-3">
                <legend className="pr-3 text-[13px] font-semibold text-ink-2">부전공</legend>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Input label="전공핵심 최소"
                      type="number"
                      min={0}
                      value={form.minor.majorRequiredMin ?? ''}
                      onChange={(e) => setForm({ ...form, minor: { ...form.minor, majorRequiredMin: e.target.value ? Number(e.target.value) : '' } })}
                    />
                  </div>
                  <div>
                    <Input label="전공계"
                      type="number"
                      min={0}
                      value={form.minor.majorCredits ?? ''}
                      onChange={(e) => setForm({ ...form, minor: { ...form.minor, majorCredits: e.target.value ? Number(e.target.value) : '' } })}
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <Input label="부전공 시 주전공 최소"
                    type="number"
                    min={0}
                    value={form.minor.primaryMajorMin ?? ''}
                    onChange={(e) => setForm({ ...form, minor: { ...form.minor, primaryMajorMin: e.target.value ? Number(e.target.value) : '' } })}
                  />
                </div>
              </fieldset>

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
                  {isSaving ? '저장 중...' : editingId ? '수정' : '추가'}
                </Button>
              </div>
            </form>
        </AdminDialog>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <AdminDialog isPending={formSession.isPending} title={<>삭제 확인</>} onClose={() => setDeleteConfirmId(null)} pending={isDeleting}>
            <p className="mt-2 text-sm text-ink-2">이 졸업요건을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="text"
                type="button"
                disabled={isDeleting} onClick={() => { if (!formSession.isPending()) setDeleteConfirmId(null); }}
              >
                취소
              </Button>
              <Button variant="textDanger"
                type="button"
                disabled={isDeleting}
                onClick={() => { if (!isDeleting) deleteRequirement(deleteConfirmId); }}
              >
                삭제
              </Button>
            </div>
        </AdminDialog>
      )}

      {/* Loading */}
      {isLoading && <AdminLoading />}

      {/* Error */}
      {error && (
        <div role="alert" className="border-t border-line-2 py-8 text-[13px] text-ink-2">
          졸업요건 목록을 불러오는데 실패했습니다.
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="border-t border-line-2 py-12 text-center">
          <p className="mt-4 text-sm text-ink-2">
            {searchQuery || collegeFilter ? '검색 결과가 없습니다.' : '등록된 졸업요건이 없습니다.'}
          </p>
        </div>
      )}

      {/* Requirement List - Grouped by College */}
      {!isLoading && grouped.length > 0 && (
        <div className="space-y-6">
          {grouped.map(([college, items]) => (
            <div key={college}>
              <h2 className="mb-3 text-sm font-semibold text-ink-2 uppercase tracking-wide">
                {college} ({items.length})
              </h2>
              <div className="border-t border-line-2">
                {items.map((item) => (
                  <AdminRow key={item._id}>
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-ink">
                            {item.departmentName}
                            <span className="ml-2 text-xs font-normal text-ink-2">{item.year}년</span>
                          </h3>
                          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
                            <span>졸업학점: <strong>{item.totalCredits}</strong></span>
                            <span>교양: <strong>{displayNum(item.generalCredits)}</strong></span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
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
                          <Button aria-label="수정" variant="text"
                            type="button"
                            onClick={() => openEdit(item)}
                            size="icon"
                            title="수정"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button aria-label="삭제" variant="textDanger"
                            type="button"
                            onClick={() => { formSession.begin(); setDeleteConfirmId(item._id); }}
                            size="icon"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </AdminRow>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
