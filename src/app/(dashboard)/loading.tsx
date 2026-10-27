export default function DashboardLoading() {
  return (
    <div className="flex min-h-[400px] items-center justify-center" role="status" aria-live="polite">
      <p className="text-[13px] leading-[18px] font-medium text-ink-2 animate-pulse">불러오는 중…</p>
    </div>
  );
}
