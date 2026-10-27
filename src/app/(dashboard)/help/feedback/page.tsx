'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, PageHeader, buttonVariants } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useToastStore } from '@/stores/toastStore';
import { useAuth } from '@/hooks/useAuth';
import { BackLink } from '../_components/HelpParts';

const EMAIL = 'fabronjeon@gmail.com';
const MAX_LENGTH = 2000;
const MIN_LENGTH = 5;

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

const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

function FeedbackSection({
  id,
  title,
  meta,
  last = false,
  children,
}: {
  id: string;
  title: React.ReactNode;
  meta?: React.ReactNode;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn('flex flex-col border-t border-line-2 pt-7', last ? 'pb-0' : 'pb-8')}
    >
      <h2 id={id} className="m-0 text-[18px] leading-[26px] font-bold tracking-[-0.02em] text-ink">
        {title}
        {meta != null && (
          <span className="ml-1.5 text-[14px] font-medium tracking-[-0.01em] text-ink-2">{meta}</span>
        )}
      </h2>
      {children}
    </section>
  );
}

export default function ContactPage() {
  const [copied, setCopied] = useState(false);
  const [content, setContent] = useState('');
  const [justSubmitted, setJustSubmitted] = useState(false);
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
      setJustSubmitted(true);
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

  const trimmedLength = content.trim().length;
  const canSubmit = trimmedLength >= MIN_LENGTH && !isPending;

  const handleSubmit = () => {
    if (trimmedLength < MIN_LENGTH) return;
    submitContact(content.trim());
  };

  let note = `${content.length} / ${MAX_LENGTH}자`;
  let noteClass = 'text-ink-2';
  if (justSubmitted && content.length === 0) {
    note = '문의가 성공적으로 제출되었습니다.';
    noteClass = 'text-positive';
  } else if (trimmedLength > 0 && trimmedLength < MIN_LENGTH) {
    note = `${MIN_LENGTH}자 이상 입력해주세요 · ${content.length} / ${MAX_LENGTH}자`;
  }

  const feedbackItems = myFeedbacks?.data ?? [];

  return (
    <div className="flex max-w-[720px] flex-col">
      <BackLink href="/help">도움말로 돌아가기</BackLink>
      <PageHeader
        title="문의 및 건의"
        description="버그, 빠진 과목, 잘못된 졸업 요건, 아이디어 — 무엇이든 보내주세요."
      />

      <FeedbackSection id="new-title" title="새 문의">
        {showMyFeedback ? (
          <form
            className="mt-3.5 flex flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <label htmlFor="fb-text" className="sr-only">
              문의 내용
            </label>
            <textarea
              id="fb-text"
              value={content}
              onChange={(e) => {
                setJustSubmitted(false);
                setContent(e.target.value.slice(0, MAX_LENGTH));
              }}
              placeholder="문의 내용을 입력하세요"
              rows={5}
              maxLength={MAX_LENGTH}
              aria-describedby="fb-note"
              className="min-h-32 w-full resize-y rounded-[10px] border-0 bg-fill p-3.5 text-[15px] leading-[23px] text-ink transition-shadow duration-150 ease-out placeholder:text-placeholder focus:shadow-[inset_0_0_0_2px_var(--color-primary)] focus:outline-none focus-visible:outline-none disabled:opacity-50"
              disabled={isPending}
            />
            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-4">
              <span
                id="fb-note"
                role="status"
                aria-live="polite"
                className={cn('text-[13px] leading-[18px] tabular-nums', noteClass)}
              >
                {note}
              </span>
              <Button type="submit" size="lg" disabled={!canSubmit}>
                {isPending ? '전송 중...' : '제출'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-2 flex flex-col items-start gap-4">
            <p className="m-0 text-[15px] leading-[23px] text-ink-2">
              문의를 남기려면 로그인이 필요합니다. 로그인 없이 보내려면 아래 이메일을 이용해 주세요.
            </p>
            <Link href="/login" className={buttonVariants({ size: 'lg' })}>
              로그인하기
            </Link>
          </div>
        )}
      </FeedbackSection>

      <FeedbackSection id="mail-title" title="이메일로 보내기" last={!showMyFeedback}>
        <div className="mt-2 flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-y border-line py-2">
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[15px] font-medium break-all text-ink">{EMAIL}</span>
            <span className="text-[13px] leading-[18px] text-ink-2">
              첨부 파일이 있거나 길게 설명해야 할 때는 이메일이 편해요.
            </span>
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              'h-11 shrink-0 cursor-pointer bg-transparent text-[14px] font-semibold transition-colors duration-150 ease-out',
              copied ? 'text-positive' : 'text-ink hover:text-primary'
            )}
          >
            <span aria-live="polite">{copied ? '복사됨' : '이메일 복사하기'}</span>
          </button>
        </div>
      </FeedbackSection>

      {showMyFeedback && (
        <FeedbackSection
          id="list-title"
          title="내 문의 내역"
          meta={feedbackLoading ? undefined : `${feedbackItems.length}건`}
          last
        >
          <div className="mt-2 flex flex-col border-b border-line">
            {feedbackLoading &&
              [1, 2].map((i) => (
                <div key={i} className="flex flex-col gap-2 border-t border-line py-4" aria-hidden="true">
                  <div className="h-4 w-32 animate-pulse bg-fill" />
                  <div className="h-5 w-full animate-pulse bg-fill" />
                </div>
              ))}

            {!feedbackLoading && feedbackItems.length === 0 && (
              <p className="m-0 border-t border-line py-4 text-[14px] leading-5 text-ink-2">
                아직 문의 내역이 없습니다.
              </p>
            )}

            {!feedbackLoading &&
              feedbackItems.map((fb) => (
                <article key={fb._id} className="flex flex-col gap-2 border-t border-line py-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[13px] text-ink-2 tabular-nums">{formatDateTime(fb.createdAt)}</span>
                    <span className="inline-flex items-center gap-4">
                      <span
                        className={cn(
                          'text-[13px] font-semibold',
                          fb.status === 'resolved' ? 'text-positive' : 'text-ink-2'
                        )}
                      >
                        {fb.status === 'pending' ? '대기중' : '해결됨'}
                      </span>
                      <button
                        type="button"
                        onClick={() => { if (window.confirm('이 문의를 삭제하시겠습니까?')) deleteFeedback(fb._id); }}
                        disabled={isDeleting}
                        aria-label="이 문의 삭제"
                        className="-my-2 inline-flex h-11 cursor-pointer items-center bg-transparent text-[13px] font-semibold text-negative transition-colors duration-150 ease-out hover:text-negative-hover disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        삭제
                      </button>
                    </span>
                  </div>
                  <p className="m-0 text-[15px] leading-[23px] whitespace-pre-wrap text-ink">{fb.message}</p>
                  {fb.adminReply && (
                    <div className="border-l-2 border-line-3 pl-3.5">
                      <p className="m-0 text-[12px] leading-4 font-semibold text-ink-2">
                        관리자 답변
                        {fb.adminReplyAt && (
                          <span className="font-medium tabular-nums"> · {formatDateTime(fb.adminReplyAt)}</span>
                        )}
                      </p>
                      <p className="m-0 mt-1 text-[14px] leading-[21px] whitespace-pre-wrap text-ink-2">
                        {fb.adminReply}
                      </p>
                    </div>
                  )}
                </article>
              ))}
          </div>
        </FeedbackSection>
      )}
    </div>
  );
}
