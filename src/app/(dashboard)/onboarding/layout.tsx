import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '시작하기 | YU 수강 플래너',
  description: '프로필과 졸업요건을 설정하고 수강 계획을 시작하세요.',
};

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
