'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import type { IPatchNoteResponse } from '@/types';
import { formatPatchNoteDate, toPatchNoteItems } from './_components/format';

// 목록에서는 앞쪽 항목만 보여주고 나머지는 상세에서 본다
const MAX_LIST_ITEMS = 4;
const truncate = (text: string, max = 140) =>
  text.length <= max ? text : text.slice(0, max) + '...';

const HEADER_DESCRIPTION = '새로 생긴 기능과 고친 점을 모아둡니다.';

export default function PatchNotesPage() {
  const { isLoading: authLoading } = useAuth();

  const { data, isLoading, error } = useQuery<{ success: boolean; data: IPatchNoteResponse[] }>({
    queryKey: ['patch-notes'],
    queryFn: async () => {
      const res = await fetch('/api/patch-notes');
      if (!res.ok) throw new Error('업데이트 소식을 불러올 수 없습니다.');
      return res.json();
    },
    enabled: !authLoading,
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex max-w-[760px] flex-col" aria-busy="true">
        <PageHeader title="업데이트 소식" description={HEADER_DESCRIPTION} />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-wrap gap-x-10 gap-y-2 border-t border-line-2 pt-7 pb-8" aria-hidden="true">
            <div className="h-5 w-[140px] animate-pulse bg-fill" />
            <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-2.5">
              <div className="h-6 w-1/2 animate-pulse bg-fill" />
              <div className="h-5 w-full animate-pulse bg-fill" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex max-w-[760px] flex-col">
        <PageHeader title="업데이트 소식" description={HEADER_DESCRIPTION} />
        <p role="alert" className="m-0 border-t border-line-2 py-7 text-[15px] leading-[23px] text-negative">
          업데이트 소식을 불러오는 중 오류가 발생했습니다.
        </p>
      </div>
    );
  }

  const patchNotes = data?.data ?? [];

  return (
    <div className="flex max-w-[760px] flex-col">
      <PageHeader title="업데이트 소식" description={HEADER_DESCRIPTION} />

      {patchNotes.length === 0 ? (
        <p className="m-0 border-t border-line-2 py-7 text-[15px] leading-[23px] text-ink-2">
          등록된 업데이트 소식이 없습니다.
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col border-b border-line-2 p-0">
          {patchNotes.map((note, index) => {
            const items = toPatchNoteItems(note.content);
            const hiddenCount = items.length - MAX_LIST_ITEMS;
            return (
              <li key={note._id} className="border-t border-line-2">
                <Link
                  href={`/patch-notes/${note._id}`}
                  className="group flex flex-wrap gap-x-10 gap-y-2 pt-7 pb-8"
                >
                  <div className="flex flex-[0_0_140px] flex-col gap-1">
                    <span className="text-[14px] font-semibold text-ink tabular-nums">
                      {formatPatchNoteDate(note.publishedAt || note.createdAt)}
                    </span>
                    {(note.version || index === 0) && (
                      <span className="text-[13px] text-ink-2">
                        {[note.version, index === 0 ? '최신' : null].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-2.5">
                    <h2 className="m-0 text-[18px] leading-[26px] font-bold tracking-[-0.02em] text-ink transition-colors duration-150 ease-out group-hover:text-primary">
                      {note.title}
                    </h2>
                    <ul className="m-0 flex list-disc flex-col gap-1.5 pl-[18px] text-[15px] leading-[23px] break-words text-ink">
                      {items.slice(0, MAX_LIST_ITEMS).map((item, i) => (
                        <li key={i}>{truncate(item)}</li>
                      ))}
                    </ul>
                    {hiddenCount > 0 && (
                      <span className="text-[13px] leading-[18px] text-ink-2">외 {hiddenCount}개 항목</span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
