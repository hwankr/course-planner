'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToastStore } from '@/stores/toastStore';
import { Card, CardContent } from '@/components/ui';
import { ArrowLeft, MessageSquare, CheckCircle, Clock, ChevronDown, ChevronUp, Loader2, Reply, Trash2 } from 'lucide-react';
import Link from 'next/link';

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

const CATEGORY_COLORS: Record<FeedbackCategory, string> = {
  bug: 'bg-red-100 text-red-700',
  feature: 'bg-blue-100 text-blue-700',
  'data-error': 'bg-orange-100 text-orange-700',
  other: 'bg-gray-100 text-gray-700',
  contact: 'bg-teal-100 text-teal-700',
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

  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<FeedbackCategory | ''>('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

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

  const { mutate: updateStatus } = useMutation({
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
  });

  const { mutate: submitReply, isPending: isReplying } = useMutation({
    mutationFn: async ({ id, adminReply }: { id: string; adminReply: string }) => {
      const res = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminReply }),
      });
      if (!res.ok) throw new Error('답변 제출에 실패했습니다.');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
      queryClient.invalidateQueries({ queryKey: ['feedback-unread-count'] });
      addToast({ type: 'success', message: '답변이 등록되었습니다.' });
      setReplyingId(null);
      setReplyContent('');
    },
    onError: (error: Error) => {
      addToast({ type: 'warning', message: error.message });
    },
  });

  const { mutate: deleteFeedback, isPending: isDeletingFeedback } = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/feedback/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('삭제에 실패했습니다.');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
      queryClient.invalidateQueries({ queryKey: ['feedback-unread-count'] });
      addToast({ type: 'success', message: '피드백이 삭제되었습니다.' });
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
      <div>
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#00AACA] transition-colors hover:text-[#153974]"
        >
          <ArrowLeft className="h-4 w-4" />
          관리자 대시보드로 돌아가기
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">피드백 관리</h1>
        <p className="mt-1 text-gray-600">
          사용자 피드백과 문의를 관리합니다. ({feedbacks.length}건)
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as FeedbackStatus | '')}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
        >
          <option value="">전체 상태</option>
          <option value="pending">대기중</option>
          <option value="resolved">해결됨</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as FeedbackCategory | '')}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
        >
          <option value="">전체 카테고리</option>
          <option value="contact">문의</option>
          <option value="bug">버그</option>
          <option value="feature">기능 요청</option>
          <option value="data-error">데이터 오류</option>
          <option value="other">기타</option>
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
          피드백 목록을 불러오는데 실패했습니다.
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && feedbacks.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm text-slate-500">피드백이 없습니다.</p>
        </div>
      )}

      {/* Feedback List */}
      {!isLoading && feedbacks.length > 0 && (
        <div className="space-y-3">
          {feedbacks.map((fb) => {
            const isExpanded = expandedIds.has(fb._id);
            const isLong = fb.message.length > 150;

            return (
              <Card key={fb._id} className="overflow-hidden">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    {/* Category badge + status */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[fb.category]}`}>
                        {CATEGORY_LABELS[fb.category]}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        fb.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {fb.status === 'pending' ? <Clock className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                        {STATUS_LABELS[fb.status]}
                      </span>
                    </div>

                    {/* Status toggle + Delete buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateStatus({
                          id: fb._id,
                          status: fb.status === 'pending' ? 'resolved' : 'pending',
                        })}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                          fb.status === 'pending'
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        {fb.status === 'pending' ? '답변 없이 해결' : '대기로 변경'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { if (window.confirm('이 피드백을 삭제하시겠습니까?')) deleteFeedback(fb._id); }}
                        disabled={isDeletingFeedback}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50 cursor-pointer"
                        title="피드백 삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="mt-3">
                    <p className={`text-sm text-slate-700 whitespace-pre-wrap leading-relaxed ${
                      !isExpanded && isLong ? 'line-clamp-3' : ''
                    }`}>
                      {fb.message}
                    </p>
                    {isLong && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(fb._id)}
                        className="mt-1 inline-flex items-center gap-0.5 text-xs font-medium text-[#00AACA] hover:text-[#153974] cursor-pointer"
                      >
                        {isExpanded ? (
                          <>접기 <ChevronUp className="h-3 w-3" /></>
                        ) : (
                          <>더보기 <ChevronDown className="h-3 w-3" /></>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Admin Reply Display */}
                  {fb.adminReply && (
                    <div className="mt-3 rounded-lg bg-green-50 border border-green-200 p-3">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                          <Reply className="h-3 w-3" />
                          관리자 답변
                        </span>
                        {fb.adminReplyAt && (
                          <span className="text-xs text-slate-400">
                            {formatDate(fb.adminReplyAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {fb.adminReply}
                      </p>
                    </div>
                  )}

                  {/* Reply Input */}
                  {!fb.adminReply && (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={replyingId === fb._id ? replyContent : ''}
                        onChange={(e) => { setReplyingId(fb._id); setReplyContent(e.target.value.slice(0, 2000)); }}
                        onFocus={() => { if (replyingId !== fb._id) { setReplyingId(fb._id); setReplyContent(''); } }}
                        placeholder="답변을 입력하세요..."
                        rows={2}
                        className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#00AACA] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
                        disabled={isReplying}
                      />
                      {replyingId === fb._id && replyContent.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">{replyContent.length}/2000</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => { setReplyingId(null); setReplyContent(''); }}
                              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                              disabled={isReplying}
                            >
                              취소
                            </button>
                            <button
                              type="button"
                              onClick={() => submitReply({ id: fb._id, adminReply: replyContent.trim() })}
                              disabled={replyContent.trim().length < 1 || isReplying}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                            >
                              {isReplying ? (
                                <><Loader2 className="h-3 w-3 animate-spin" />전송 중...</>
                              ) : (
                                <><Reply className="h-3 w-3" />답변 및 해결 처리</>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Meta info */}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span>
                      {fb.userId ? `${fb.userId.name} (${fb.userId.email})` : fb.email || '익명'}
                    </span>
                    <span>{formatDate(fb.createdAt)}</span>
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
