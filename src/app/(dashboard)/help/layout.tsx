import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '도움말 | YU 수강 플래너',
  description: '수강 계획과 졸업요건 관리 방법을 알아보세요.',
};

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
