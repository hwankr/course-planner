import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '졸업 가이드 | YU 수강 플래너',
  description: '영남대학교 포털에서 졸업요건을 확인하는 방법을 안내합니다.',
};

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
