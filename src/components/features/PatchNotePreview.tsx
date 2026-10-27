'use client';

import { cn } from '@/lib/utils';

interface PatchNotePreviewProps {
  title: string;
  content: string;
  version?: string;
}

/**
 * 업데이트 소식 미리보기 컴포넌트
 * 관리자가 발행 전 유저에게 어떻게 보이는지 확인할 수 있음
 *
 * // SYNC: 알림 드롭다운 아이템 마크업은 layout.tsx의 notification item rendering과 동기화 필요
 * // SYNC: 상세 마크업은 app/(dashboard)/patch-notes/[id]/page.tsx와 동기화 필요
 */
export function PatchNotePreview({ title, content, version }: PatchNotePreviewProps) {
  const displayTitle = title.trim() || '제목을 입력하세요';
  const displayContent = content.trim() || '내용을 입력하세요';
  const truncatedTitle = displayTitle.length > 50
    ? displayTitle.slice(0, 50) + '...'
    : displayTitle;

  return (
    <section aria-label="미리보기" className="flex flex-col gap-5 border-t border-line-2 pt-5">
      <h3 className="m-0 text-[13px] leading-[18px] font-semibold text-ink-2">미리보기</h3>

      {/* Section 1: Notification Dropdown Preview */}
      <div className="flex flex-col gap-1.5">
        <p className="m-0 text-[12px] leading-4 font-medium text-ink-2">알림 드롭다운</p>
        <div className="max-w-[360px] rounded-none border border-line-2 bg-white">
          {/* SYNC: layout.tsx NotificationMenu item rendering */}
          <div className="flex min-h-[56px] flex-col justify-center gap-0.5 px-4 py-2.5">
            <span className="text-[14px] leading-5 font-medium text-ink">
              새로운 업데이트: {truncatedTitle}
            </span>
            <span className="text-[12px] leading-4 text-ink-2">업데이트 · 방금 전</span>
          </div>
        </div>
      </div>

      {/* Section 2: Content Detail Preview */}
      <div className="flex flex-col gap-1.5">
        <p className="m-0 text-[12px] leading-4 font-medium text-ink-2">업데이트 소식 상세</p>
        <div className="flex flex-col border border-line-2 p-5">
          <h4
            className={cn(
              'm-0 text-[22px] leading-[30px] font-bold tracking-[-0.02em] break-words md:text-[26px] md:leading-[34px]',
              title.trim() ? 'text-ink' : 'text-placeholder'
            )}
          >
            {displayTitle}
          </h4>
          <p className="m-0 mt-1.5 text-[13px] leading-[18px] text-ink-2 tabular-nums">
            방금 전{version?.trim() && <> · {version.trim()}</>}
          </p>
          <div className="mt-5 max-h-64 overflow-y-auto border-t border-line-2 pt-5">
            <p
              className={cn(
                'm-0 text-[15px] leading-6 break-words whitespace-pre-wrap',
                content.trim() ? 'text-ink' : 'text-placeholder'
              )}
            >
              {displayContent}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
