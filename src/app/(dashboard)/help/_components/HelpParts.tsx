import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/** 도움말 섹션: 제목 20/28 700, 아래 1px Line2, padding 28 0 36 */
export function HelpSection({
  id,
  title,
  last = false,
  children,
}: {
  id: string;
  title: React.ReactNode;
  /** 마지막 섹션은 아래 구분선·여백 없음 */
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn('flex scroll-mt-16 flex-col pt-7 md:scroll-mt-6', last ? 'pb-0' : 'border-b border-line-2 pb-9')}
    >
      <h2 id={`${id}-title`} className="m-0 text-[20px] leading-7 font-bold tracking-[-0.02em] text-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** 본문 15/23 Ink2 */
export function HelpText({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('mt-2 mb-0 text-[15px] leading-[23px] text-ink-2', className)}>{children}</p>;
}

/** 번호 단계 리스트: 번호 13/600 Primary tabular + 본문 15/23, 행 사이 1px Line */
export function HelpSteps({ steps, className }: { steps: React.ReactNode[]; className?: string }) {
  return (
    <ol className={cn('m-0 mt-4 flex list-none flex-col p-0', className)}>
      {steps.map((step, index) => (
        <li
          key={index}
          className={cn(
            'flex items-baseline gap-5 border-t border-line py-3.5',
            index === steps.length - 1 && 'border-b'
          )}
        >
          <span className="w-6 shrink-0 text-[13px] font-semibold text-primary tabular-nums">{index + 1}</span>
          <span className="min-w-0 text-[15px] leading-[23px] break-words text-ink">{step}</span>
        </li>
      ))}
    </ol>
  );
}

/** 이름 — 설명 형식의 단계 본문 */
export function StepText({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <>
      <span className="font-semibold">{title}</span> — {children}
    </>
  );
}

/** 왼쪽 15 Ink · 오른쪽 14 Ink2 설명 행 묶음 (높이 46) */
export function HelpDefinitionList({ rows }: { rows: { term: React.ReactNode; detail: React.ReactNode }[] }) {
  return (
    <div className="mt-4 flex flex-col">
      {rows.map((row, index) => (
        <div
          key={index}
          className={cn(
            'flex min-h-[46px] items-center justify-between gap-4 border-t border-line py-2',
            index === rows.length - 1 && 'border-b'
          )}
        >
          <span className="shrink-0 text-[15px] text-ink">{row.term}</span>
          <span className="text-right text-[14px] text-ink-2">{row.detail}</span>
        </div>
      ))}
    </div>
  );
}

/** 화살표가 붙은 Primary 글자 링크 (15/600) */
export function ArrowLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex min-h-11 items-center gap-1.5 self-start text-[15px] font-semibold text-primary transition-colors duration-150 ease-out hover:text-primary-hover',
        className
      )}
    >
      {children}
      <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={2.5} />
    </Link>
  );
}

/** 복귀 글자 링크: ArrowLeft 14 + 14/600 Ink2 */
export function BackLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex min-h-11 items-center gap-1 self-start text-[14px] font-semibold text-ink-2 transition-colors duration-150 ease-out hover:text-ink md:min-h-0 md:pb-1',
        className
      )}
    >
      <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.5} />
      {children}
    </Link>
  );
}

/** 스크린샷 묶음 */
export function HelpFigures({ children }: { children: React.ReactNode }) {
  return <div className="mt-5 flex flex-col gap-4">{children}</div>;
}
