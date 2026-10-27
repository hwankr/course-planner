'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { IPatchNoteResponse } from '@/types';
import { formatPatchNoteDate } from '../_components/format';
import { LoginNotice } from '../_components/LoginNotice';

function BackLink() {
  return (
    <Link
      href="/patch-notes"
      className="inline-flex min-h-11 items-center gap-1 self-start text-[14px] font-semibold text-ink-2 transition-colors duration-150 ease-out hover:text-ink md:min-h-0 md:pb-1"
    >
      <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.5} />
      업데이트 소식
    </Link>
  );
}

export default function PatchNoteDetailPage() {
  const params = useParams();
  const { isAuthenticated, isGuest, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data, isLoading, error } = useQuery<{ success: boolean; data: IPatchNoteResponse }>({
    queryKey: ['patch-note', id],
    queryFn: async () => {
      const res = await fetch(`/api/patch-notes/${id}`);
      if (!res.ok) throw Object.assign(new Error('업데이트 소식을 불러올 수 없습니다.'), { status: res.status });
      return res.json();
    },
    enabled: !!id && !authLoading,
    retry: (failureCount, error) => !('status' in error && (error.status === 401 || error.status === 404)) && failureCount < 3,
  });

  // 읽음 처리 + 알림 카운트 갱신
  useEffect(() => {
    if (data?.success && isAuthenticated && !isGuest) {
      fetch(`/api/patch-notes/${id}/read`, { method: 'POST' }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      });
    }
  }, [data?.success, id, isAuthenticated, isGuest, queryClient]);

  const patchNote = data?.data;

  if (authLoading || isLoading) {
    return (
      <div className="flex max-w-[720px] flex-col gap-3" aria-busy="true">
        <div className="h-5 w-24 animate-pulse bg-fill" />
        <div className="h-[34px] w-2/3 animate-pulse bg-fill" />
        <div className="mt-6 h-48 animate-pulse bg-fill" />
      </div>
    );
  }

  if (error || !patchNote) {
    return (
      <div className="flex max-w-[720px] flex-col">
        <BackLink />
        <h1 className="mt-2 text-[26px] leading-[34px] font-bold text-ink">업데이트 소식</h1>
        {error && 'status' in error && error.status === 401 ? <LoginNotice /> : (
        <p role="alert" className="m-0 mt-4 border-t border-line-2 py-7 text-[15px] leading-[23px] text-negative">
          업데이트 소식을 찾을 수 없습니다.
        </p>
        )}
      </div>
    );
  }

  return (
    <article className="flex max-w-[720px] flex-col">
      <BackLink />
      {/* 개별 노트 제목은 콘텐츠 — 상단바가 '업데이트 소식'만 보여주므로 모든 폭에서 표시 */}
      <header className="flex flex-col gap-1.5 pt-2 pb-7 md:pt-1">
        <h1 className="m-0 text-[22px] leading-[30px] font-bold tracking-[-0.02em] break-words text-ink md:text-[26px] md:leading-[34px]">
          {patchNote.title}
        </h1>
        <p className="m-0 text-[13px] leading-[18px] text-ink-2 tabular-nums">
          {formatPatchNoteDate(patchNote.publishedAt || patchNote.createdAt)}
          {patchNote.version && <> · {patchNote.version}</>}
        </p>
      </header>

      <div className="border-t border-line-2 pt-7">
        <p className="m-0 text-[15px] leading-6 break-words whitespace-pre-wrap text-ink">{patchNote.content}</p>
      </div>
    </article>
  );
}
