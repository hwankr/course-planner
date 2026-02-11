'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button, Toast } from '@/components/ui';
import { cn } from '@/lib/utils';
import OnboardingGuard from '@/components/providers/OnboardingGuard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  CalendarDays,
  User,
  Shield,
  Menu,
  X,
  AlertTriangle,
  BarChart3,
  HelpCircle,
  Gift,
  Calendar,
  ChevronDown,
  LogOut,
} from 'lucide-react';

const primaryNavigation = [
  { name: '수강 계획', href: '/planner', icon: Calendar },
  { name: '학사 일정', href: '/calendar', icon: CalendarDays },
  { name: '학과 통계', href: '/statistics', icon: BarChart3 },
];

const secondaryNavigation = [
  { name: '이벤트', href: '/event', icon: Gift },
  { name: '도움말', href: '/help', icon: HelpCircle },
];

const adminNavigation = [{ name: '관리자', href: '/admin', icon: Shield }];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, isAdmin, isGuest, loginWithGoogle } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMoreMenuOpen(false);
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="bg-gray-50 bg-grid">
      {/* Gradient Accent Bar */}
      <div className="h-1 bg-gradient-to-r from-[#153974] via-[#3069B3] to-[#00AACA]" />

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between gap-2">
            <div className="flex items-center gap-3 md:gap-8 min-w-0 flex-1">
              <Link href="/planner" className="flex items-center gap-2 min-w-0 shrink">
                <Image src="/yu-logo.svg" alt="영남대학교" className="h-5 md:h-6 shrink-0" width={60} height={24} style={{ width: 'auto' }} />
                <span className="text-sm sm:text-base md:text-xl font-bold text-gradient truncate">YU 수강 플래너</span>
              </Link>
              <nav className="hidden md:flex gap-1 flex-shrink-0">
                {primaryNavigation.map((item) => {
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
                <div ref={moreMenuRef} className="relative">
                  <button
                    onClick={() => { setMoreMenuOpen(!moreMenuOpen); setUserMenuOpen(false); }}
                    className={cn(
                      'px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap',
                      secondaryNavigation.some(item => pathname === item.href)
                        ? 'bg-[#153974]/10 text-[#153974] font-semibold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                    aria-expanded={moreMenuOpen}
                    aria-haspopup="true"
                  >
                    더보기
                    <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', moreMenuOpen && 'rotate-180')} />
                  </button>
                  {moreMenuOpen && (
                    <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border py-1 z-50" role="menu">
                      {secondaryNavigation.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMoreMenuOpen(false)}
                            className={cn(
                              'flex items-center gap-2 px-4 py-2.5 text-sm transition-colors',
                              pathname === item.href
                                ? 'bg-[#153974]/10 text-[#153974] font-semibold'
                                : 'text-gray-600 hover:bg-gray-50'
                            )}
                            role="menuitem"
                          >
                            <Icon className="w-4 h-4" />
                            {item.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </nav>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {!isGuest && user?.name ? (
                <div ref={userMenuRef} className="relative">
                  <button
                    onClick={() => { setUserMenuOpen(!userMenuOpen); setMoreMenuOpen(false); }}
                    className="flex items-center gap-2 rounded-full hover:bg-gray-50 px-1 py-1 transition-colors"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#153974] to-[#3069B3] flex items-center justify-center text-white text-xs font-medium">
                      {user.name.charAt(0)}
                    </div>
                    <span className="hidden sm:inline text-sm text-gray-600 max-w-[100px] truncate">{user.name}</span>
                    <ChevronDown className={cn('hidden sm:block w-3.5 h-3.5 text-gray-400 transition-transform', userMenuOpen && 'rotate-180')} />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border py-1 z-50" role="menu">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2.5 text-sm transition-colors',
                          pathname === '/profile'
                            ? 'bg-[#153974]/10 text-[#153974] font-semibold'
                            : 'text-gray-600 hover:bg-gray-50'
                        )}
                        role="menuitem"
                      >
                        <User className="w-4 h-4" />
                        프로필
                      </Link>
                      <button
                        onClick={() => { setUserMenuOpen(false); logout(); }}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 w-full text-left transition-colors"
                        role="menuitem"
                      >
                        <LogOut className="w-4 h-4" />
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              ) : isGuest ? (
                <>
                  <Button variant="ghost" size="sm" onClick={loginWithGoogle} className="text-xs sm:text-sm whitespace-nowrap">
                    구글 로그인
                  </Button>
                  <Link href="/register">
                    <Button variant="default" size="sm" className="text-xs sm:text-sm whitespace-nowrap">회원가입</Button>
                  </Link>
                </>
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
              {/* Primary */}
              {primaryNavigation.map((item) => {
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
              {/* Admin */}
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
              <div className="border-t my-1" />
              {/* Secondary */}
              {secondaryNavigation.map((item) => {
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
              <div className="border-t my-1" />
              {/* 프로필 & 로그아웃 */}
              {!isGuest && (
                <>
                  {user?.name && (
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'px-3 py-3 rounded-md text-sm font-medium transition-colors flex items-center gap-2',
                        pathname === '/profile'
                          ? 'bg-[#153974]/10 text-[#153974] font-semibold'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <User className="w-4 h-4" />
                      프로필
                    </Link>
                  )}
                  <button
                    onClick={() => { setMobileMenuOpen(false); logout(); }}
                    className="px-3 py-3 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2 w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    로그아웃
                  </button>
                </>
              )}
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
            <div className="flex items-center gap-3">
              <button onClick={loginWithGoogle} className="text-sm font-medium text-amber-900 hover:text-amber-700 underline">
                구글로 로그인
              </button>
              <Link href="/register" className="text-sm font-medium text-amber-900 hover:text-amber-700 underline">
                회원가입하기
              </Link>
            </div>
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
