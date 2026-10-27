import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SectionHeaderProps {
  title: React.ReactNode;
  /** 제목 오른쪽에 붙는 보조 정보 (14/500 Ink2) — 예: "24학점 · 수강중 15" */
  meta?: React.ReactNode;
  /** 제목 아래 캡션 (13/18 Ink2) */
  caption?: React.ReactNode;
  /** 오른쪽 액션 슬롯 (글자 버튼 등) */
  action?: React.ReactNode;
  as?: 'h2' | 'h3';
  id?: string;
  className?: string;
}

/** Heading 18/26 700 −2% + 선택적 meta/caption/action */
export function SectionHeader({
  title,
  meta,
  caption,
  action,
  as: Heading = 'h2',
  id,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-end justify-between gap-4', className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <Heading
          id={id}
          className="m-0 text-[18px] leading-[26px] font-bold tracking-[-0.02em] text-ink"
        >
          {title}
          {meta != null && (
            <span className="ml-1.5 text-[14px] font-medium tracking-[-0.01em] text-ink-2">{meta}</span>
          )}
        </Heading>
        {caption != null && (
          <p className="m-0 text-[13px] leading-[18px] font-medium text-ink-2">{caption}</p>
        )}
      </div>
      {action != null && <div className="flex shrink-0 items-center gap-1">{action}</div>}
    </div>
  );
}
