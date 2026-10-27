import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '학과 통계 | YU 수강 플래너',
  description: '같은 학과의 인기 과목과 익명 수강 계획을 확인하세요.',
};

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
