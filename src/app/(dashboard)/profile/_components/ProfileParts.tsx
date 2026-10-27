'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/** 프로필 섹션: 위 1px Line2, padding 28 0 32 (모바일은 Fill 띠로 구분) */
export function ProfileSection({
  id,
  title,
  description,
  children,
  className,
}: {
  id: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn('flex flex-col pt-7 pb-8 md:border-t md:border-line-2', className)}
    >
      <h2
        id={id}
        className={cn(
          'm-0 text-[18px] leading-[26px] font-bold tracking-[-0.02em] text-ink',
          description == null && 'mb-2'
        )}
      >
        {title}
      </h2>
      {description != null && (
        <p className="mt-1.5 mb-2 text-[14px] leading-5 text-ink-2">{description}</p>
      )}
      {children}
    </section>
  );
}

/** 모바일 섹션 구분 띠 (Fill 10px, 페이지 가터까지 확장) */
export function SectionBand() {
  return <div aria-hidden="true" className="-mx-5 h-2.5 bg-fill md:hidden" />;
}

/** 라벨 13/600 Ink2(포커스 시 Primary) + 컨트롤 + 도움말 12/16 */
export function Field({
  label,
  htmlFor,
  labelId,
  helper,
  accent = false,
  children,
  className,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  labelId?: string;
  helper?: React.ReactNode;
  /** 새로 나타난 필드: 라벨을 Primary로 */
  accent?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const LabelTag = htmlFor ? 'label' : 'span';
  return (
    <div className={cn('group flex flex-col gap-1.5 pt-4', className)}>
      <LabelTag
        id={labelId}
        htmlFor={htmlFor}
        className={cn(
          'text-[13px] leading-[18px] font-semibold transition-colors duration-150 ease-out',
          accent ? 'text-primary' : 'text-ink-2 group-focus-within:text-primary'
        )}
      >
        {label}
      </LabelTag>
      {children}
      {helper != null && <span className="text-[12px] leading-4 text-ink-2">{helper}</span>}
    </div>
  );
}

/** 밑줄형 select: 높이 40, 아래 1px #DDE1E8, 포커스 시 2px Primary */
export const UnderlineSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        'h-10 w-full cursor-pointer appearance-none rounded-none border-0 border-b border-line-3 bg-transparent pr-7 pl-0 text-[17px] font-medium text-ink transition-colors duration-150 ease-out focus:border-primary focus:shadow-[inset_0_-1px_0_var(--color-primary)] focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 right-0 h-[18px] w-[18px] -translate-y-1/2 text-placeholder"
    />
  </div>
));
UnderlineSelect.displayName = 'UnderlineSelect';

/** 계정 정보 행: 높이 46, 왼쪽 15 Ink2 · 오른쪽 15/500 */
export function InfoRow({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[46px] items-center justify-between gap-4 border-b border-line py-2">
      <span className="shrink-0 text-[15px] text-ink-2">{label}</span>
      <span className="text-right text-[15px] font-medium text-ink">{children}</span>
    </div>
  );
}

/** 계정 관리 행: min-h 60, 제목 15/500 + 설명 12 Ink2, 오른쪽 Negative 글자 버튼 */
export function DangerRow({
  title,
  description,
  actionLabel,
  onAction,
  disabled,
}: {
  title: React.ReactNode;
  description: React.ReactNode;
  actionLabel: React.ReactNode;
  onAction: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex min-h-[60px] items-center justify-between gap-4 border-b border-line py-2">
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[15px] font-medium text-ink">{title}</span>
        <span className="text-[12px] leading-4 text-ink-2">{description}</span>
      </span>
      <button
        type="button"
        onClick={onAction}
        disabled={disabled}
        className="h-11 shrink-0 cursor-pointer bg-transparent px-1 text-[14px] font-semibold text-negative transition-colors duration-150 ease-out hover:text-negative-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        {actionLabel}
      </button>
    </div>
  );
}
