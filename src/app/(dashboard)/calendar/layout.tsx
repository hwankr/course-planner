import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '학사 일정 | YU 수강 플래너',
  description: '학사 일정과 공휴일을 달력에서 확인하세요.',
};

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
