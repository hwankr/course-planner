import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '졸업 요건 관리 | YU 수강 플래너',
  description: 'YU 수강 플래너 졸업 요건 관리: 학과와 기준 연도별 졸업 학점 및 전공 이수 요건을 관리합니다.',
};

export default function AdminPageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
