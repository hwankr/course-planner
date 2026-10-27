import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '회원가입 | YU 수강 플래너',
  description: 'YU 수강 플래너에 가입하고 수강 계획을 저장하세요.',
};

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
