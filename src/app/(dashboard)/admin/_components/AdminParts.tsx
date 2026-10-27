import type { HTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ListRow, PageHeader } from '@/components/ui';
import { cn } from '@/lib/utils';

export function AdminHeader({ title, description, actions }: { title: string; description: ReactNode; actions?: ReactNode }) {
  return (
    <div>
      <Link href="/admin" className="mb-4 inline-flex min-h-10 items-center gap-2 text-[14px] font-semibold text-primary hover:text-primary-hover">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        관리자 대시보드로 돌아가기
      </Link>
      <PageHeader title={title} description={description} actions={actions} className="pb-0" />
    </div>
  );
}

export function AdminRow({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <ListRow data-admin-row size="tall" className={cn('block py-2 md:min-h-[52px]', className)} {...props} />;
}

export function AdminLoading() {
  return (
    <div className="flex min-h-40 items-center justify-center" role="status" aria-live="polite">
      <p className="animate-pulse text-[13px] leading-[18px] font-medium text-ink-2">불러오는 중…</p>
    </div>
  );
}
