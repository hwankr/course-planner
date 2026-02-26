import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-blue-100 p-3">
        <svg className="h-8 w-8 text-[#153974]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">페이지를 찾을 수 없습니다</h2>
        <p className="text-sm text-gray-600">요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>
      </div>
      <Link
        href="/planner"
        className="rounded-md bg-[#153974] px-4 py-2 text-sm font-medium text-white hover:bg-[#003E7E] focus:outline-none focus:ring-2 focus:ring-[#00AACA] focus:ring-offset-2"
      >
        수강 플래너로 이동
      </Link>
    </div>
  );
}
