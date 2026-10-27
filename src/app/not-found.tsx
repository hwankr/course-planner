import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '페이지를 찾을 수 없음 | YU 수강 플래너',
  description: '요청하신 페이지가 존재하지 않거나 이동되었습니다. YU 수강 플래너로 돌아가세요.',
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-7 bg-white px-5 py-16 text-center text-ink">
      <div className="flex flex-col gap-2">
        <span className="text-[44px] leading-[52px] font-bold tracking-[-0.03em] tabular-nums">404</span>
        <h1 className="text-[26px] leading-[34px] font-bold tracking-[-0.02em]">페이지를 찾을 수 없음</h1>
        <p className="text-[15px] leading-6 text-ink-2">요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>
      </div>
      <Link
        href="/planner"
        className="inline-flex h-12 items-center justify-center rounded-[12px] bg-primary px-[22px] text-[15px] font-semibold text-white transition-colors duration-150 ease-out hover:bg-primary-hover"
      >
        수강 플래너로 이동
      </Link>
    </main>
  );
}
