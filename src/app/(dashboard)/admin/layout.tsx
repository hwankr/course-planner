import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '관리자 대시보드 | YU 수강 플래너',
  description: 'YU 수강 플래너 관리자 대시보드에서 과목, 학과, 사용자와 운영 현황을 확인합니다.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
