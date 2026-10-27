import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '업데이트 소식 | YU 수강 플래너',
  description: 'YU 수강 플래너의 새로운 기능과 개선 사항을 확인하세요.',
};

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
