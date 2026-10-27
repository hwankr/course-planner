import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '프로필 | YU 수강 플래너',
  description: '학과, 입학년도와 전공 설정을 관리하세요.',
};

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
