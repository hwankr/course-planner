'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdminMutation, useAdminFormSession } from '../_components/useAdminMutation';
import { useAuth } from '@/hooks/useAuth';
import { useToastStore } from '@/stores/toastStore';
import { Button, Select, Textarea } from '@/components/ui';
import { AdminHeader, AdminRow, AdminLoading } from '../_components/AdminParts';
import { AdminConfirmDialog } from '../_components/AdminDialog';
import { MessageSquare, CheckCircle, Clock, ChevronDown, ChevronUp, Loader2, Reply, Trash2 } from 'lucide-react';

type FeedbackCategory = 'bug' | 'feature' | 'data-error' | 'other' | 'contact';
type FeedbackStatus = 'pending' | 'resolved';

interface FeedbackItem {
  _id: string;
  category: FeedbackCategory;
  message: string;
  email?: string;
  userId?: { _id: string; email: string; name: string };
  status: FeedbackStatus;
  createdAt: string;
  updatedAt: string;
  adminReply?: string;
  adminReplyAt?: string;
  isReadByAdmin: boolean;
  isReadByUser: boolean;
}

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: '버그',
  feature: '기능 요청',
  'data-error': '데이터 오류',
  other: '기타',
  contact: '문의',
};

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  pending: '대기중',
  resolved: '해결됨',
};

export default function AdminFeedbackPage() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const addToast = useToastStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const formSession = useAdminFormSession();

  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<FeedbackCategory | ''>('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (categoryFilter) params.set('category', categoryFilter);
    params.set('limit', '100');
    return params.toString();
  };

  const { data, isLoading, error } = useQuery<{ success: boolean; data: FeedbackItem[] }>({
    queryKey: ['admin-feedback', statusFilter, categoryFilter],
    queryFn: async () => {
      const res = await fetch(`/api/feedback?${buildQueryString()}`);
      if (!res.ok) throw new Error('피드백 목록을 불러오는데 실패했습니다.');
      return res.json();
    },
    enabled: isAdmin && !authLoading,
  });

  const { mutate: updateStatus } = useAdminMutation({
    mutationFn: async ({ id, status }: { id: string; status: FeedbackStatus }) => {
      const res = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('상태 업데이트에 실패했습니다.');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
      queryClient.invalidateQueries({ queryKey: ['feedback-unread-count'] });
      addToast({ type: 'success', message: '피드백 상태가 업데이트되었습니다.' });
    },
    onError: (error: Error) => {
      addToast({ type: 'warning', message: error.message });
    },
  }, formSession);

  const { mutate: submitReply, isPending: isReplying } = useAdminMutation({
    mutationFn: async ({ id, adminReply }: { id: string; adminReply: string }) => {
      const res = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminReply }),
      });
      if (!res.ok) throw new Error('답변 제출에 실패했습니다.');
      return res.json();
    },
    onSuccess: (_result, _variables, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
      queryClient.invalidateQueries({ queryKey: ['feedback-unread-count'] });
      addToast({ type: 'success', message: '답변이 등록되었습니다.' });
      if (formSession.isCurrent(sessionId)) setReplyingId(null);
      if (formSession.isCurrent(sessionId)) setReplyContent('');
    },
    onError: (error: Error) => {
      addToast({ type: 'warning', message: error.message });
    },
  }, formSession);

  const { mutate: deleteFeedback, isPending: isDeletingFeedback } = useAdminMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/feedback/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('삭제에 실패했습니다.');
      return res.json();
    },
    onSuccess: (_result, _variables, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
      queryClient.invalidateQueries({ queryKey: ['feedback-unread-count'] });
      addToast({ type: 'success', message: '피드백이 삭제되었습니다.' });
      if (formSession.isCurrent(sessionId)) setDeletingId(null);
    },
    onError: (error: Error) => {
      addToast({ type: 'warning', message: error.message });
    },
  }, formSession);

  const unreadIds = (data?.data ?? []).filter(fb => !fb.isReadByAdmin).map(fb => fb._id);
  const unreadKey = unreadIds.join(',');
  const marking = useRef(new Set<string>());
  const [readError, setReadError] = useState(false);
  const [readAttempt, setReadAttempt] = useState(0);
  useEffect(() => {
    if (!unreadKey || marking.current.has(unreadKey)) return;
    marking.current.add(unreadKey);
    // Explicit write only after the returned list has rendered; already-read rows are excluded.
    fetch('/api/feedback/mark-read', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: unreadKey.split(',') }),
    }).then(res => {
      if (!res.ok) throw new Error('읽음 처리 실패');
      setReadError(false);
      queryClient.invalidateQueries({ queryKey: ['feedback-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
    }).catch(() => setReadError(true)).finally(() => { marking.current.delete(unreadKey); });
  }, [unreadKey, queryClient, readAttempt]);

  // Auth guard - render early returns AFTER all hooks
  if (authLoading) {
    return <AdminLoading />;
  }

  if (!isAdmin) {
    router.push('/planner');
    return null;
  }

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const feedbacks = data?.data ?? [];

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminHeader
        title="피드백 관리"
        description={<>사용자 피드백과 문의를 관리합니다. ({feedbacks.length}건)</>}
      />

      {readError && <div role="alert" className="text-sm text-ink-2">읽음 처리에 실패했습니다. <Button variant="outline" onClick={() => setReadAttempt(n => n + 1)}>다시 시도</Button></div>}
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select aria-label="상태"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as FeedbackStatus | '')}
        >
          <option value="">전체 상태</option>
          <option value="pending">대기중</option>
          <option value="resolved">해결됨</option>
        </Select>

        <Select aria-label="카테고리"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as FeedbackCategory | '')}
        >
          <option value="">전체 카테고리</option>
          <option value="contact">문의</option>
          <option value="bug">버그</option>
          <option value="feature">기능 요청</option>
          <option value="data-error">데이터 오류</option>
          <option value="other">기타</option>
        </Select>
      </div>

      {/* Loading */}
      {isLoading && <AdminLoading />}

      {/* Error */}
      {error && (
        <div role="alert" className="border-t border-line-2 py-8 text-[13px] text-ink-2">
          피드백 목록을 불러오는데 실패했습니다.
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && feedbacks.length === 0 && (
        <div className="border-t border-line-2 py-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-placeholder" />
          <p className="mt-4 text-sm text-ink-2">피드백이 없습니다.</p>
        </div>
      )}

      {/* Feedback List */}
      {!isLoading && feedbacks.length > 0 && (
        <div className="border-t border-line-2">
          {feedbacks.map((fb) => {
            const isExpanded = expandedIds.has(fb._id);
            const isLong = fb.message.length > 150;

            return (
              <AdminRow key={fb._id}>
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    {/* Category badge + status */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-ink-2">
                        {CATEGORY_LABELS[fb.category]}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                        fb.status === 'pending' ? 'text-ink-2' : 'text-positive'
                      }`}>
                        {fb.status === 'pending' ? <Clock className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                        {STATUS_LABELS[fb.status]}
                      </span>
                    </div>

                    {/* Status toggle + Delete buttons */}
                    <div className="flex items-center gap-2">
                      <Button variant="text"
                        type="button"
                        onClick={() => updateStatus({
                          id: fb._id,
                          status: fb.status === 'pending' ? 'resolved' : 'pending',
                        })}
                      >
                        {fb.status === 'pending' ? '답변 없이 해결' : '대기로 변경'}
                      </Button>
                      <Button aria-label="피드백 삭제" variant="textDanger"
                        type="button"
                        onClick={() => { formSession.begin(); setDeletingId(fb._id); }}
                        disabled={isDeletingFeedback}
                        size="icon"
                        title="피드백 삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="mt-3">
                    <p id={`feedback-${fb._id}`} className={`text-sm text-ink break-words whitespace-pre-wrap leading-relaxed ${
                      !isExpanded && isLong ? 'line-clamp-3' : ''
                    }`}>
                      {fb.message}
                    </p>
                    {isLong && (
                      <Button variant="text"
                        type="button"
                        aria-expanded={isExpanded} aria-controls={`feedback-${fb._id}`} onClick={() => toggleExpand(fb._id)}
                      >
                        {isExpanded ? (
                          <>접기 <ChevronUp className="h-3 w-3" /></>
                        ) : (
                          <>더보기 <ChevronDown className="h-3 w-3" /></>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Admin Reply Display */}
                  {fb.adminReply && (
                    <div className="mt-3 border-t border-line py-3">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-positive">
                          <Reply className="h-3 w-3" />
                          관리자 답변
                        </span>
                        {fb.adminReplyAt && (
                          <span className="text-xs text-ink-2">
                            {formatDate(fb.adminReplyAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-ink break-words whitespace-pre-wrap leading-relaxed">
                        {fb.adminReply}
                      </p>
                    </div>
                  )}

                  {/* Reply Input */}
                  {!fb.adminReply && (
                    <div className="mt-3 space-y-2">
                      <Textarea label="관리자 답변"
                        value={replyingId === fb._id ? replyContent : ''}
                        onChange={(e) => { setReplyingId(fb._id); setReplyContent(e.target.value.slice(0, 2000)); }}
                        onFocus={() => { if (replyingId !== fb._id) { formSession.begin(); setReplyingId(fb._id); setReplyContent(''); } }}
                        placeholder="답변을 입력하세요..."
                        rows={2}
                        disabled={isReplying}
                      />
                      {replyingId === fb._id && replyContent.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-ink-2">{replyContent.length}/2000</span>
                          <div className="flex gap-2">
                            <Button variant="text"
                              type="button"
                              onClick={() => { setReplyingId(null); setReplyContent(''); }}
                              disabled={isReplying}
                            >
                              취소
                            </Button>
                            <Button variant="primary"
                              type="button"
                              onClick={() => submitReply({ id: fb._id, adminReply: replyContent.trim() })}
                              disabled={replyContent.trim().length < 1 || isReplying}
                            >
                              {isReplying ? (
                                <><Loader2 className="h-3 w-3 animate-spin" />전송 중...</>
                              ) : (
                                <><Reply className="h-3 w-3" />답변 및 해결 처리</>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Meta info */}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ink-2">
                    <span>
                      {fb.userId ? `${fb.userId.name} (${fb.userId.email})` : fb.email || '익명'}
                    </span>
                    <span>{formatDate(fb.createdAt)}</span>
                  </div>
                </div>
              </AdminRow>
            );
          })}
        </div>
      )}
      {deletingId && <AdminConfirmDialog isPending={formSession.isPending} title="피드백 삭제" description="이 피드백을 삭제하시겠습니까?" onClose={() => setDeletingId(null)} onConfirm={() => deleteFeedback(deletingId)} pending={isDeletingFeedback} />}
    </div>
  );
}
