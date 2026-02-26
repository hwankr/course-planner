'use client';

import Link from 'next/link';
import { ArrowLeft, Mail, MessageSquare, Copy, Check, Send, Loader2, Clock, CheckCircle, MessageSquareText, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/stores/toastStore';
import { useAuth } from '@/hooks/useAuth';

const EMAIL = 'fabronjeon@gmail.com';

interface MyFeedbackItem {
  _id: string;
  category: string;
  message: string;
  status: 'pending' | 'resolved';
  adminReply?: string;
  adminReplyAt?: string;
  isReadByUser: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ContactPage() {
  const [copied, setCopied] = useState(false);
  const [content, setContent] = useState('');
  const addToast = useToastStore((s) => s.addToast);
  const { isAuthenticated, isGuest } = useAuth();
  const queryClient = useQueryClient();
  const showMyFeedback = isAuthenticated && !isGuest;

  const { data: myFeedbacks, isLoading: feedbackLoading } = useQuery<{ success: boolean; data: MyFeedbackItem[] }>({
    queryKey: ['my-feedback'],
    queryFn: async () => {
      const res = await fetch('/api/feedback/my');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: showMyFeedback,
  });

  useEffect(() => {
    if (myFeedbacks?.data) {
      queryClient.invalidateQueries({ queryKey: ['feedback-unread-count'] });
    }
  }, [myFeedbacks?.data, queryClient]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const { mutate: submitContact, isPending } = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'contact', content: text }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '문의 제출에 실패했습니다.');
      }
      return res.json();
    },
    onSuccess: () => {
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['my-feedback'] });
      queryClient.invalidateQueries({ queryKey: ['feedback-unread-count'] });
      addToast({ type: 'success', message: '문의가 성공적으로 제출되었습니다.' });
    },
    onError: (error: Error) => {
      addToast({ type: 'warning', message: error.message });
    },
  });

  const { mutate: deleteFeedback, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/feedback/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '문의 삭제에 실패했습니다.');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-feedback'] });
      queryClient.invalidateQueries({ queryKey: ['feedback-unread-count'] });
      addToast({ type: 'success', message: '문의가 삭제되었습니다.' });
    },
    onError: (error: Error) => {
      addToast({ type: 'warning', message: error.message });
    },
  });

  const handleSubmit = () => {
    if (content.trim().length < 5) return;
    submitContact(content.trim());
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-3xl px-4 pb-12 pt-6 md:px-6 md:pt-10">
        <Link
          href="/help"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[#00AACA] transition-colors hover:text-[#153974]"
        >
          <ArrowLeft className="h-4 w-4" />
          도움말로 돌아가기
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 md:p-12">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            <MessageSquare className="h-3.5 w-3.5" />
            Contact
          </div>

          <h1 className="text-2xl font-bold text-[#153974] sm:text-3xl md:text-4xl">
            문의하기
          </h1>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed sm:text-base">
            궁금한 점이나 문의 사항이 있으시면 아래 메일로 연락 주세요.
          </p>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:mt-8 sm:p-5">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#153974] to-[#1a4a8f] sm:h-12 sm:w-12">
                <Mail className="h-5 w-5 text-white sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500 sm:text-sm">이메일</p>
                <p className="truncate text-sm font-semibold text-[#153974] sm:text-lg">
                  {EMAIL}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-600 transition-colors hover:border-[#153974] hover:text-[#153974] sm:mt-4 sm:w-auto cursor-pointer"
              title="이메일 복사"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-green-600">복사됨</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>이메일 복사하기</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 빠른 문의 카드 */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 md:p-12">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#00AACA]/10 px-3 py-1 text-xs font-semibold text-[#00AACA]">
            <Send className="h-3.5 w-3.5" />
            빠른 문의
          </div>

          <h2 className="text-xl font-bold text-[#153974] sm:text-2xl">
            문의 남기기
          </h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            간단한 문의사항을 남겨주세요. 관리자가 확인합니다.
          </p>

          {showMyFeedback ? (
            <div className="mt-5">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, 2000))}
                placeholder="문의 내용을 입력하세요"
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#00AACA] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
                disabled={isPending}
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {content.length}/2000
                </span>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={content.trim().length < 5 || isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#153974] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a4a8f] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      전송 중...
                    </>
                  ) : content.trim().length < 5 ? (
                    <>
                      <Send className="h-4 w-4" />
                      5자 이상 입력해주세요
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      문의 남기기
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-sm text-slate-500">
                문의를 남기려면 로그인이 필요합니다.
              </p>
              <Link
                href="/login"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#153974] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a4a8f]"
              >
                로그인하기
              </Link>
            </div>
          )}
        </div>

        {/* 내 문의 내역 */}
        {showMyFeedback && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 md:p-12">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-600">
              <MessageSquareText className="h-3.5 w-3.5" />
              내 문의 내역
            </div>

            <h2 className="text-xl font-bold text-[#153974] sm:text-2xl">
              문의 내역 확인
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              내가 남긴 문의와 관리자 답변을 확인할 수 있습니다.
            </p>

            {feedbackLoading && (
              <div className="mt-5 space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            )}

            {!feedbackLoading && (!myFeedbacks?.data || myFeedbacks.data.length === 0) && (
              <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <MessageSquareText className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm text-slate-500">아직 문의 내역이 없습니다.</p>
              </div>
            )}

            {!feedbackLoading && myFeedbacks?.data && myFeedbacks.data.length > 0 && (
              <div className="mt-5 space-y-3">
                {myFeedbacks.data.map((fb) => (
                  <div
                    key={fb._id}
                    className={`rounded-xl border p-4 transition-colors ${
                      fb.adminReply
                        ? 'border-l-4 border-l-green-400 border-slate-200 bg-green-50/30'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          fb.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {fb.status === 'pending' ? <Clock className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                          {fb.status === 'pending' ? '대기중' : '해결됨'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(fb.createdAt).toLocaleDateString('ko-KR', {
                            year: 'numeric', month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { if (window.confirm('이 문의를 삭제하시겠습니까?')) deleteFeedback(fb._id); }}
                        disabled={isDeleting}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50 cursor-pointer"
                        title="문의 삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {fb.message}
                    </p>

                    {fb.adminReply && (
                      <div className="mt-3 rounded-lg bg-white border border-green-200 p-3">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                            관리자 답변
                          </span>
                          {fb.adminReplyAt && (
                            <span className="text-xs text-slate-400">
                              {new Date(fb.adminReplyAt).toLocaleDateString('ko-KR', {
                                year: 'numeric', month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {fb.adminReply}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
