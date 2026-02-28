import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Providers } from '@/components/providers/Providers';
import { ClarityScript } from '@/components/providers/ClarityScript';
import { GoogleAnalytics } from '@/components/providers/GoogleAnalytics';
import { Footer } from '@/components/ui';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'YU 수강 플래너',
  description: '영남대학교 학생을 위한 학기별 수강 계획 및 졸업 요건 추적 시스템',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || 'https://yu-planner.vercel.app'
  ),
  openGraph: {
    title: 'YU 수강 플래너',
    description: '영남대학교 학생을 위한 학기별 수강 계획 및 졸업 요건 추적 시스템',
    type: 'website',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YU 수강 플래너',
    description: '영남대학교 학생을 위한 학기별 수강 계획 및 졸업 요건 추적 시스템',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        <div className="flex-1 bg-gray-50">
          <Providers>{children}</Providers>
        </div>
        <Footer />
        <Analytics />
        <SpeedInsights />
        <ClarityScript />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
