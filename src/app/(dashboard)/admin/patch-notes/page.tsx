'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdminMutation, useAdminFormSession } from '../_components/useAdminMutation';
import { invalidateAdminData } from '../_components/adminCache';
import { useAuth } from '@/hooks/useAuth';
import { useToastStore } from '@/stores/toastStore';
import { Button, Input, Select, Textarea } from '@/components/ui';
import { AdminHeader, AdminRow, AdminLoading } from '../_components/AdminParts';
import { AdminDialog, AdminConfirmDialog } from '../_components/AdminDialog';
import { PatchNotePreview } from '@/components/features';
import {
  Plus,
  Loader2,
  Trash2,
  Pencil,
  Send,
  Eye,
  EyeOff,
  FileText,
  Megaphone,
} from 'lucide-react';
import type { IPatchNoteResponse, PatchNoteStatus } from '@/types';

const STATUS_LABELS: Record<PatchNoteStatus, string> = {
  draft: '초안',
  published: '발행됨',
};

const STATUS_COLORS: Record<PatchNoteStatus, string> = {
  draft: 'text-ink-2',
  published: 'text-positive',
};

export default function AdminPatchNotesPage() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const addToast = useToastStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const formSession = useAdminFormSession();

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

  const { mutate: createPatchNote, isPending: isCreating } = useAdminMutation({
    mutationFn: async (body: { title: string; content: string; version?: string; status?: PatchNoteStatus }) => {
      const res = await fetch('/api/patch-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('업데이트 소식 생성에 실패했습니다.');
      return res.json();
    },
    onSuccess: (_result, _variables, sessionId) => {
      void invalidateAdminData(queryClient, 'patch-notes');
      addToast({ type: 'success', message: '업데이트 소식이 생성되었습니다.' });
      if (formSession.isCurrent(sessionId)) resetForm();
    },
    onError: (error: Error) => {
      addToast({ type: 'warning', message: error.message });
    },
  }, formSession);

  const { mutate: updatePatchNote, isPending: isUpdating } = useAdminMutation({
    mutationFn: async ({ id, ...body }: { id: string; title?: string; content?: string; version?: string }) => {
      const res = await fetch(`/api/patch-notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('업데이트 소식 수정에 실패했습니다.');
      return res.json();
    },
    onSuccess: (_result, _variables, sessionId) => {
      void invalidateAdminData(queryClient, 'patch-notes');
      addToast({ type: 'success', message: '업데이트 소식이 수정되었습니다.' });
      if (formSession.isCurrent(sessionId)) resetForm();
    },
    onError: (error: Error) => {
      addToast({ type: 'warning', message: error.message });
    },
  }, formSession);

  const { mutate: publishPatchNote, isPending: isPublishing } = useAdminMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/patch-notes/${id}/publish`, { method: 'PATCH' });
      if (!res.ok) throw new Error('업데이트 소식 발행에 실패했습니다.');
      return res.json();
    },
    onSuccess: () => {
      void invalidateAdminData(queryClient, 'patch-notes');
      addToast({ type: 'success', message: '업데이트 소식이 발행되었습니다.' });
    },
    onError: (error: Error) => {
      addToast({ type: 'warning', message: error.message });
    },
  }, formSession);

  const { mutate: deletePatchNote, isPending: isDeleting } = useAdminMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/patch-notes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('업데이트 소식 삭제에 실패했습니다.');
      return res.json();
    },
    onSuccess: (_result, _variables, sessionId) => {
      void invalidateAdminData(queryClient, 'patch-notes');
      addToast({ type: 'success', message: '업데이트 소식이 삭제되었습니다.' });
      if (formSession.isCurrent(sessionId)) setDeletingId(null);
    },
    onError: (error: Error) => {
      addToast({ type: 'warning', message: error.message });
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
    formSession.begin();
    setShowForm(true);
  };

  const handleSubmit = (publishNow: boolean) => {
    if (isCreating || isUpdating) return;
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
      <AdminHeader
        title="업데이트 소식 관리"
        description={<>앱 변경사항과 업데이트 내역을 관리합니다. ({patchNotes.length}건)</>}
        actions={<Button type="button" variant={showForm ? 'outline' : 'primary'} onClick={() => { resetForm(); formSession.begin(); setShowForm(true); }}><Plus aria-hidden="true" className="h-4 w-4" />새 업데이트 소식</Button>}
      />

      {/* Create/Edit Form */}
      {showForm && (
        <AdminDialog isPending={formSession.isPending} title={editingId ? '업데이트 소식 수정' : '새 업데이트 소식 작성'} onClose={resetForm} pending={isMutating} wide>

            <div className={showPreview ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}>
              {/* Form Fields */}
              <div className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="min-w-0 flex-1">
                    <Input label="제목 *"
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value.slice(0, 200))}
                      placeholder="업데이트 제목을 입력하세요"
                      maxLength={200}
                      disabled={isMutating}
                    />
                    <p className="mt-1 text-xs text-ink-2 text-right">{formTitle.length}/200</p>
                  </div>
                  <div className="w-full sm:w-40">
                    <Input label="버전"
                      type="text"
                      value={formVersion}
                      onChange={(e) => setFormVersion(e.target.value.slice(0, 50))}
                      placeholder="v1.0.0"
                      maxLength={50}
                      disabled={isMutating}
                    />
                  </div>
                </div>

                <div>
                  <Textarea label="내용 *"
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value.slice(0, 5000))}
                    placeholder="변경사항을 입력하세요..."
                    rows={6}
                    maxLength={5000}
                    disabled={isMutating}
                  />
                  <p className="mt-1 text-xs text-ink-2 text-right">{formContent.length}/5000</p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <Button variant="outline"
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? (
                      <><EyeOff className="h-3.5 w-3.5" />미리보기 닫기</>
                    ) : (
                      <><Eye className="h-3.5 w-3.5" />미리보기</>
                    )}
                  </Button>

                  <div className="flex gap-2">
                    <Button variant="primary"
                      type="button"
                      onClick={() => handleSubmit(false)}
                      disabled={isMutating}
                    >
                      {isMutating ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" />저장 중...</>
                      ) : (
                        <><FileText className="h-3.5 w-3.5" />{editingId ? '수정 저장' : '초안 저장'}</>
                      )}
                    </Button>
                    {!editingId && (
                      <Button variant="text"
                        type="button"
                        onClick={() => handleSubmit(true)}
                        disabled={isMutating}
                      >
                        {isMutating ? (
                          <><Loader2 className="h-3.5 w-3.5 animate-spin" />발행 중...</>
                        ) : (
                          <><Send className="h-3.5 w-3.5" />바로 발행</>
                        )}
                      </Button>
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
        </AdminDialog>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select aria-label="상태"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as PatchNoteStatus | '')}
        >
          <option value="">전체 상태</option>
          <option value="draft">초안</option>
          <option value="published">발행됨</option>
        </Select>
      </div>

      {/* Loading */}
      {isLoading && <AdminLoading />}

      {/* Error */}
      {error && (
        <div role="alert" className="border-t border-line-2 py-8 text-[13px] text-ink-2">
          업데이트 소식 목록을 불러오는데 실패했습니다.
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && patchNotes.length === 0 && (
        <div className="border-t border-line-2 py-12 text-center">
          <Megaphone className="mx-auto h-12 w-12 text-placeholder" />
          <p className="mt-4 text-sm text-ink-2">업데이트 소식이 없습니다.</p>
          {!showForm && (
            <Button variant="text"
              type="button"
              onClick={() => { resetForm(); formSession.begin(); setShowForm(true); }}
            >
              <Plus className="h-4 w-4" />
              첫 업데이트 소식 작성
            </Button>
          )}
        </div>
      )}

      {/* Patch Notes List */}
      {!isLoading && patchNotes.length > 0 && (
        <div className="border-t border-line-2">
          {patchNotes.map((note) => {
            const isExpanded = expandedIds.has(note._id);
            const isLong = note.content.length > 150;

            return (
              <AdminRow key={note._id}>
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    {/* Title + Badges */}
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <h3 className="text-sm font-semibold text-ink truncate max-w-[300px]">
                        {note.title}
                      </h3>
                      {note.version && (
                        <span className="inline-flex text-xs font-semibold text-ink-2">
                          {note.version}
                        </span>
                      )}
                      <span className={`inline-flex text-xs font-semibold ${STATUS_COLORS[note.status]}`}>
                        {STATUS_LABELS[note.status]}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {note.status === 'draft' && (
                        <Button variant="text"
                          type="button"
                          disabled={isPublishing} onClick={() => { if (!isPublishing) publishPatchNote(note._id); }}
                        >
                          발행
                        </Button>
                      )}
                      <Button aria-label="수정" variant="text"
                        type="button"
                        onClick={() => startEdit(note)}
                        size="icon"
                        title="수정"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {(
                        <Button aria-label="삭제" variant="textDanger"
                          type="button"
                          onClick={() => { formSession.begin(); setDeletingId(note._id); }}
                          size="icon"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="mt-3">
                    <p id={`patch-note-${note._id}`} className={`text-sm text-ink break-words whitespace-pre-wrap leading-relaxed ${
                      !isExpanded && isLong ? 'line-clamp-3' : ''
                    }`}>
                      {note.content}
                    </p>
                    {isLong && (
                      <Button variant="text"
                        type="button"
                        aria-expanded={isExpanded} aria-controls={`patch-note-${note._id}`} onClick={() => toggleExpand(note._id)}
                      >
                        {isExpanded ? '접기' : '더보기'}
                      </Button>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ink-2">
                    {note.createdBy && (
                      <span>작성: {note.createdBy.name}</span>
                    )}
                    <span>생성: {formatDate(note.createdAt)}</span>
                    {note.publishedAt && (
                      <span>발행: {formatDate(note.publishedAt)}</span>
                    )}
                  </div>
                </div>
              </AdminRow>
            );
          })}
        </div>
      )}
      {deletingId && <AdminConfirmDialog isPending={formSession.isPending} title="업데이트 소식 삭제" description="정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다." onClose={() => setDeletingId(null)} onConfirm={() => deletePatchNote(deletingId)} pending={isDeleting} />}
    </div>
  );
}
