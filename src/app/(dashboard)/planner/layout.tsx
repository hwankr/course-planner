import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '수강 계획 | YU 수강 플래너',
  description: '학기별 수강 계획을 세우고 졸업요건 이수 현황을 확인하세요.',
};

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
