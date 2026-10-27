import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '과목 관리 | YU 수강 플래너',
  description: 'YU 수강 플래너 과목 관리: 과목 정보를 검색하고 추가, 수정, 삭제합니다.',
};

export default function AdminPageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
