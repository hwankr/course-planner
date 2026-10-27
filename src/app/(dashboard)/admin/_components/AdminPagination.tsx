import { Button } from '@/components/ui';
import type { Pagination } from '@/types/admin';

export function AdminPagination({ pagination, pending, onPage }: {
  pagination?: Pagination; pending: boolean; onPage: (page: number) => void;
}) {
  if (!pagination) return null;
  const { page, total, totalPages } = pagination;
  return <nav aria-label="목록 페이지" className="flex flex-wrap items-center justify-between gap-3 border-t border-line-2 py-3 text-[13px] text-ink-2">
    <span aria-live="polite">총 {total.toLocaleString()}건 · {page} / {Math.max(1, totalPages)}페이지</span>
    <div className="flex gap-2">
      <Button variant="outline" disabled={pending || page <= 1} onClick={() => onPage(page - 1)}>이전</Button>
      <Button variant="outline" disabled={pending || page >= totalPages} onClick={() => onPage(page + 1)}>다음</Button>
    </div>
  </nav>;
}
