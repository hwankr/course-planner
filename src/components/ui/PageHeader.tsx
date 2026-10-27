import * as React from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: React.ReactNode;
  /** 제목 아래 설명 (모바일 13/18, md 이상 14/20 Ink2) */
  description?: React.ReactNode;
  /** 오른쪽 액션 슬롯 (글자 버튼, 바 높이 Primary 버튼 하나) */
  actions?: React.ReactNode;
  id?: string;
  className?: string;
}

/**
 * 페이지 머리: Title 26/34 700 −2% + 설명 + 오른쪽 액션, 아래 여백 28.
 * md 미만에서는 대시보드 상단바가 제목을 보여주므로 제목을 숨기고 캡션부터 시작한다.
 */
export function PageHeader({ title, description, actions, id, className }: PageHeaderProps) {
  const hasDescription = description != null;
  const hasActions = actions != null;

  return (
    <div
      className={cn(
        'flex flex-wrap items-end justify-between gap-4 pb-7',
        !hasDescription && !hasActions && 'hidden md:flex',
        className,
      )}
    >
      <div className={cn('flex min-w-0 flex-col gap-1.5', !hasDescription && 'hidden md:flex')}>
        <h1
          id={id}
          className="m-0 hidden text-[26px] leading-[34px] font-bold tracking-[-0.02em] text-ink md:block"
        >
          {title}
        </h1>
        {hasDescription && (
          <p className="m-0 text-[13px] leading-[18px] text-ink-2 md:text-[14px] md:leading-5">{description}</p>
        )}
      </div>
      {hasActions && <div className="flex flex-wrap items-center gap-1">{actions}</div>}
    </div>
  );
}
