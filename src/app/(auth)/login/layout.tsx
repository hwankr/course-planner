import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '로그인 | YU 수강 플래너',
  description: 'YU 수강 플래너에 로그인하고 수강 계획을 이어가세요.',
};

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
