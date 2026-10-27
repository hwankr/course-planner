import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '문의 및 건의 | YU 수강 플래너',
  description: 'YU 수강 플래너에 대한 문의와 개선 의견을 보내주세요.',
};

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
