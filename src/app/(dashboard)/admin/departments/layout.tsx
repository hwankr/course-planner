import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '학과 관리 | YU 수강 플래너',
  description: 'YU 수강 플래너 학과 관리: 대학과 학과 정보를 조회하고 관리합니다.',
};

export default function AdminPageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
