import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '업데이트 소식 관리 | YU 수강 플래너',
  description: 'YU 수강 플래너 업데이트 소식 관리: 업데이트 소식을 작성하고 미리보기, 수정 및 발행합니다.',
};

export default function AdminPageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
