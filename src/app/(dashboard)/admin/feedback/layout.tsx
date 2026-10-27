import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '피드백 관리 | YU 수강 플래너',
  description: 'YU 수강 플래너 피드백 관리: 사용자의 피드백을 확인하고 답변 및 처리 상태를 관리합니다.',
};

export default function AdminPageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
