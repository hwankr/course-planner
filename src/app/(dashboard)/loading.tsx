export default function DashboardLoading() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#153974]" />
        <p className="text-sm text-gray-500">로딩 중...</p>
      </div>
    </div>
  );
}
