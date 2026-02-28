'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToastStore } from '@/stores/toastStore';
import { Card, CardContent } from '@/components/ui';
import { PatchNotePreview } from '@/components/features';
import {
  ArrowLeft,
  Plus,
  Loader2,
  Trash2,
  Pencil,
  Send,
  Eye,
  EyeOff,
  FileText,
  X,
  Megaphone,
} from 'lucide-react';
import Link from 'next/link';
import type { IPatchNoteResponse, PatchNoteStatus } from '@/types';

const STATUS_LABELS: Record<PatchNoteStatus, string> = {
  draft: '초안',
  published: '발행됨',
};

const STATUS_COLORS: Record<PatchNoteStatus, string> = {
  draft: 'bg-yellow-100 text-yellow-700',
  published: 'bg-green-100 text-green-700',
};

export default function AdminPatchNotesPage() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const addToast = useToastStore((s) => s.addToast);
  const queryClient = useQueryClient();

  // Filter state
  const [statusFilter, setStatusFilter] = useState<PatchNoteStatus | ''>('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formVersion, setFormVersion] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Expand state
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    return params.toString();
  };

  const { data, isLoading, error } = useQuery<{ success: boolean; data: IPatchNoteResponse[] }>({
    queryKey: ['admin-patch-notes', statusFilter],
    queryFn: async () => {
      const qs = buildQueryString();
      const res = await fetch(`/api/patch-notes${qs ? `?${qs}` : ''}`);
      if (!res.ok) throw new Error('업데이트 소식 목록을 불러오는데 실패했습니다.');
      return res.json();
    },
    enabled: isAdmin && !authLoading,
  });

  const { mutate: createPatchNote, isPending: isCreating } = useMutation({
    mutationFn: async (body: { title: string; content: string; version?: string; status?: PatchNoteStatus }) => {
      const res = await fetch('/api/patch-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('업데이트 소식 생성에 실패했습니다.');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-patch-notes'] });
      addToast({ type: 'success', message: '업데이트 소식이 생성되었습니다.' });
      resetForm();
    },
    onError: (error: Error) => {
      addToast({ type: 'warning', message: error.message });
    },
  });

  const { mutate: updatePatchNote, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, ...body }: { id: string; title?: string; content?: string; version?: string }) => {
      const res = await fetch(`/api/patch-notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('업데이트 소식 수정에 실패했습니다.');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-patch-notes'] });
      addToast({ type: 'success', message: '업데이트 소식이 수정되었습니다.' });
      resetForm();
    },
    onError: (error: Error) => {
      addToast({ type: 'warning', message: error.message });
    },
  });

  const { mutate: publishPatchNote } = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/patch-notes/${id}/publish`, { method: 'PATCH' });
      if (!res.ok) throw new Error('업데이트 소식 발행에 실패했습니다.');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-patch-notes'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      addToast({ type: 'success', message: '업데이트 소식이 발행되었습니다.' });
    },
    onError: (error: Error) => {
      addToast({ type: 'warning', message: error.message });
    },
  });

  const { mutate: deletePatchNote, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/patch-notes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('업데이트 소식 삭제에 실패했습니다.');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-patch-notes'] });
      addToast({ type: 'success', message: '업데이트 소식이 삭제되었습니다.' });
      setDeletingId(null);
    },
    onError: (error: Error) => {
      addToast({ type: 'warning', message: error.message });
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

  const patchNotes = data?.data ?? [];

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormTitle('');
    setFormContent('');
    setFormVersion('');
    setShowPreview(false);
  };

  const startEdit = (note: IPatchNoteResponse) => {
    setEditingId(note._id);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormVersion(note.version || '');
    setShowForm(true);
  };

  const handleSubmit = (publishNow: boolean) => {
    const trimmedTitle = formTitle.trim();
    const trimmedContent = formContent.trim();

    if (!trimmedTitle || !trimmedContent) {
      addToast({ type: 'warning', message: '제목과 내용을 모두 입력해주세요.' });
      return;
    }

    const version = formVersion.trim() || undefined;

    if (editingId) {
      updatePatchNote({ id: editingId, title: trimmedTitle, content: trimmedContent, version });
    } else {
      createPatchNote({
        title: trimmedTitle,
        content: trimmedContent,
        version,
        status: publishNow ? 'published' : 'draft',
      });
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isMutating = isCreating || isUpdating;

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
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">업데이트 소식 관리</h1>
            <p className="mt-1 text-gray-600">
              앱 변경사항과 업데이트 내역을 관리합니다. ({patchNotes.length}건)
            </p>
          </div>
          {!showForm && (
            <button
              type="button"
              onClick={() => { resetForm(); setShowForm(true); }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#153974] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0f2a57] cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              새 업데이트 소식
            </button>
          )}
        </div>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? '업데이트 소식 수정' : '새 업데이트 소식 작성'}
              </h2>
              <button
                type="button"
                onClick={resetForm}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className={showPreview ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}>
              {/* Form Fields */}
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      제목 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value.slice(0, 200))}
                      placeholder="업데이트 제목을 입력하세요"
                      maxLength={200}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
                      disabled={isMutating}
                    />
                    <p className="mt-1 text-xs text-slate-400 text-right">{formTitle.length}/200</p>
                  </div>
                  <div className="w-32 sm:w-40">
                    <label className="block text-sm font-medium text-slate-700 mb-1">버전</label>
                    <input
                      type="text"
                      value={formVersion}
                      onChange={(e) => setFormVersion(e.target.value.slice(0, 50))}
                      placeholder="v1.0.0"
                      maxLength={50}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
                      disabled={isMutating}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    내용 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value.slice(0, 5000))}
                    placeholder="변경사항을 입력하세요..."
                    rows={6}
                    maxLength={5000}
                    className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
                    disabled={isMutating}
                  />
                  <p className="mt-1 text-xs text-slate-400 text-right">{formContent.length}/5000</p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-600 transition-colors hover:bg-purple-100 cursor-pointer"
                  >
                    {showPreview ? (
                      <><EyeOff className="h-3.5 w-3.5" />미리보기 닫기</>
                    ) : (
                      <><Eye className="h-3.5 w-3.5" />미리보기</>
                    )}
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSubmit(false)}
                      disabled={isMutating}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                    >
                      {isMutating ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" />저장 중...</>
                      ) : (
                        <><FileText className="h-3.5 w-3.5" />{editingId ? '수정 저장' : '초안 저장'}</>
                      )}
                    </button>
                    {!editingId && (
                      <button
                        type="button"
                        onClick={() => handleSubmit(true)}
                        disabled={isMutating}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 cursor-pointer"
                      >
                        {isMutating ? (
                          <><Loader2 className="h-3.5 w-3.5 animate-spin" />발행 중...</>
                        ) : (
                          <><Send className="h-3.5 w-3.5" />바로 발행</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Preview Panel */}
              {showPreview && (
                <PatchNotePreview
                  title={formTitle}
                  content={formContent}
                  version={formVersion}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as PatchNoteStatus | '')}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
        >
          <option value="">전체 상태</option>
          <option value="draft">초안</option>
          <option value="published">발행됨</option>
        </select>
      </div>

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
          업데이트 소식 목록을 불러오는데 실패했습니다.
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && patchNotes.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Megaphone className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm text-slate-500">업데이트 소식이 없습니다.</p>
          {!showForm && (
            <button
              type="button"
              onClick={() => { resetForm(); setShowForm(true); }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#153974] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0f2a57] cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              첫 업데이트 소식 작성
            </button>
          )}
        </div>
      )}

      {/* Patch Notes List */}
      {!isLoading && patchNotes.length > 0 && (
        <div className="space-y-3">
          {patchNotes.map((note) => {
            const isExpanded = expandedIds.has(note._id);
            const isLong = note.content.length > 150;

            return (
              <Card key={note._id} className="overflow-hidden">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    {/* Title + Badges */}
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate max-w-[300px]">
                        {note.title}
                      </h3>
                      {note.version && (
                        <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          {note.version}
                        </span>
                      )}
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[note.status]}`}>
                        {STATUS_LABELS[note.status]}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {note.status === 'draft' && (
                        <button
                          type="button"
                          onClick={() => publishPatchNote(note._id)}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 cursor-pointer"
                        >
                          발행
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => startEdit(note)}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-500 cursor-pointer"
                        title="수정"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {deletingId === note._id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => deletePatchNote(note._id)}
                            disabled={isDeleting}
                            className="rounded-lg bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
                          >
                            확인
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(null)}
                            className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 cursor-pointer"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeletingId(note._id)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 cursor-pointer"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="mt-3">
                    <p className={`text-sm text-slate-700 whitespace-pre-wrap leading-relaxed ${
                      !isExpanded && isLong ? 'line-clamp-3' : ''
                    }`}>
                      {note.content}
                    </p>
                    {isLong && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(note._id)}
                        className="mt-1 inline-flex items-center gap-0.5 text-xs font-medium text-[#00AACA] hover:text-[#153974] cursor-pointer"
                      >
                        {isExpanded ? '접기' : '더보기'}
                      </button>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    {note.createdBy && (
                      <span>작성: {note.createdBy.name}</span>
                    )}
                    <span>생성: {formatDate(note.createdAt)}</span>
                    {note.publishedAt && (
                      <span>발행: {formatDate(note.publishedAt)}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
