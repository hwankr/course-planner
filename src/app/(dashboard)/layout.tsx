'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button, Toast } from '@/components/ui';
import { cn } from '@/lib/utils';
import OnboardingGuard from '@/components/providers/OnboardingGuard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Calendar,
  User,
  Shield,
  Menu,
  X,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';

const navigation = [
  { name: '수강 계획', href: '/planner', icon: Calendar },
  { name: '학과 통계', href: '/statistics', icon: BarChart3 },
  { name: '프로필', href: '/profile', icon: User },
];

const adminNavigation = [{ name: '관리자', href: '/admin', icon: Shield }];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, isAdmin, isGuest } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const visibleNavigation = isGuest
    ? navigation.filter((item) => item.href !== '/statistics')
    : navigation;

  return (
    <div className="bg-gray-50 bg-grid">
      {/* Gradient Accent Bar */}
      <div className="h-1 bg-gradient-to-r from-[#153974] via-[#3069B3] to-[#00AACA]" />

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between gap-2">
            <div className="flex items-center gap-3 md:gap-8 min-w-0 flex-1 overflow-hidden">
              <Link href="/planner" className="flex items-center gap-2 min-w-0 shrink">
                <Image src="/yu-logo.svg" alt="영남대학교" className="h-5 md:h-6 shrink-0" width={60} height={24} style={{ width: 'auto' }} />
                <span className="text-sm sm:text-base md:text-xl font-bold text-gradient truncate">YU 수강 플래너</span>
              </Link>
              <nav className="hidden md:flex gap-1 flex-shrink-0">
                {visibleNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap',
                        pathname === item.href
                          ? 'bg-[#153974]/10 text-[#153974] font-semibold'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  );
                })}
                {!isGuest && isAdmin &&
                  adminNavigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap',
                          pathname.startsWith(item.href)
                            ? 'bg-purple-50 text-purple-600'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {item.name}
                      </Link>
                    );
                  })}
              </nav>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {!isGuest && user?.name && (
                <>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#153974] to-[#3069B3] flex items-center justify-center text-white text-xs font-medium">
                    {user.name.charAt(0)}
                  </div>
                  <span className="hidden sm:inline text-sm text-gray-600 max-w-[100px] truncate">{user.name}</span>
                </>
              )}
              {isGuest ? (
                <Link href="/register">
                  <Button variant="default" size="sm" className="text-xs sm:text-sm whitespace-nowrap">회원가입</Button>
                </Link>
              ) : (
                <Button variant="ghost" size="sm" onClick={logout} className="text-xs sm:text-sm whitespace-nowrap">
                  로그아웃
                </Button>
              )}
              <button
                className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t animate-fade-in-down">
            <nav className="container mx-auto px-4 py-2 flex flex-col gap-1">
              {visibleNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'px-3 py-3 rounded-md text-sm font-medium transition-colors flex items-center gap-2',
                      pathname === item.href
                        ? 'bg-[#153974]/10 text-[#153974] font-semibold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
              {!isGuest && isAdmin &&
                adminNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'px-3 py-3 rounded-md text-sm font-medium transition-colors flex items-center gap-2',
                        pathname.startsWith(item.href)
                          ? 'bg-purple-50 text-purple-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  );
                })}
            </nav>
          </div>
        )}
      </header>

      {/* Guest Warning Banner */}
      {isGuest && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-800" />
              <p className="text-xs sm:text-sm text-amber-800">
                비회원 모드입니다. 데이터가 이 브라우저에만 저장됩니다.
              </p>
            </div>
            <Link href="/register" className="text-sm font-medium text-amber-900 hover:text-amber-700 underline">
              회원가입하기
            </Link>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-3 py-4 sm:px-4 sm:py-8">
        <ErrorBoundary>
          <OnboardingGuard>{children}</OnboardingGuard>
        </ErrorBoundary>
      </main>

      {/* Toast Notifications */}
      <Toast />
    </div>
  );
}
