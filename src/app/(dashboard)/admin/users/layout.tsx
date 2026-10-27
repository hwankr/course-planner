import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '사용자 관리 | YU 수강 플래너',
  description: 'YU 수강 플래너 사용자 관리: 사용자 정보와 수강 계획을 확인하고 계정 및 역할을 관리합니다.',
};

export default function AdminPageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
