'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Calendar,
  ChevronDown,
  LogOut,
  Bell,
  MessageSquareText,
  CheckCheck,
  Megaphone,
} from 'lucide-react';

const primaryNavigation = [
  { name: '수강 계획', href: '/planner', icon: Calendar },
  { name: '학사 일정', href: '/calendar', icon: CalendarDays },
  { name: '학과 통계', href: '/statistics', icon: BarChart3 },
];

const secondaryNavigation = [
  { name: '도움말', href: '/help', icon: HelpCircle },
  { name: '문의 및 건의', href: '/help/feedback', icon: MessageSquareText },
  { name: '업데이트 소식', href: '/patch-notes', icon: Megaphone },
];

const adminNavigation = [{ name: '관리자', href: '/admin', icon: Shield }];

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  href: string;
  createdAt: string;
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, isAdmin, isGuest, isAuthenticated, loginWithGoogle } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [supportMenuOpen, setSupportMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: unreadData } = useQuery<{ success: boolean; data: { count: number } }>({
    queryKey: ['notifications-unread-count', user?.id],
    queryFn: async () => {
      const res = await fetch('/api/notifications/unread-count');
      if (!res.ok) return { success: false, data: { count: 0 } };
      return res.json();
    },
    enabled: isAuthenticated && !isGuest,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const unreadCount = unreadData?.data?.count ?? 0;

  const { data: notificationsData } = useQuery<{ success: boolean; data: NotificationItem[] }>({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const res = await fetch('/api/notifications');
      if (!res.ok) return { success: false, data: [] };
      return res.json();
    },
    enabled: isAuthenticated && !isGuest && notificationMenuOpen,
    staleTime: 10000,
  });

  const notifications = notificationsData?.data ?? [];

  const { mutate: markAllRead } = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/notifications/mark-read', { method: 'POST' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target as Node)) {
        setNotificationMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMoreMenuOpen(false);
        setUserMenuOpen(false);
        setNotificationMenuOpen(false);
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
                          'relative px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap',
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
                    onClick={() => { setMoreMenuOpen(!moreMenuOpen); setUserMenuOpen(false); setNotificationMenuOpen(false); }}
                    className={cn(
                      'relative px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap',
                      secondaryNavigation.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))
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
                              pathname === item.href || pathname.startsWith(item.href + '/')
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
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {!isGuest && isAuthenticated && (
                <div ref={notificationMenuRef} className="relative">
                  <button
                    onClick={() => { setNotificationMenuOpen(!notificationMenuOpen); setMoreMenuOpen(false); setUserMenuOpen(false); }}
                    className="relative p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                    title="알림"
                    aria-expanded={notificationMenuOpen}
                    aria-haspopup="true"
                  >
                    <Bell className={cn('w-5 h-5', unreadCount > 0 ? 'text-gray-700' : 'text-gray-400')} />
                    {unreadCount > 0 && (
                      <span className={cn(
                        'absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold px-1',
                        isAdmin ? 'bg-yellow-400 text-yellow-900' : 'bg-red-500 text-white'
                      )}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {notificationMenuOpen && (
                    <div className="fixed left-2 right-2 mt-1 sm:absolute sm:left-auto sm:right-0 sm:w-80 bg-white rounded-lg shadow-lg border py-1 z-50" role="menu">
                      <div className="flex items-center justify-between px-4 py-2.5 border-b">
                        <span className="text-sm font-semibold text-gray-900">알림</span>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={() => markAllRead()}
                            className="inline-flex items-center gap-1 text-xs text-[#00AACA] hover:text-[#153974] font-medium transition-colors cursor-pointer"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            모두 읽음
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <Bell className="mx-auto h-8 w-8 text-gray-300" />
                            <p className="mt-2 text-sm text-gray-500">알림이 없습니다.</p>
                          </div>
                        ) : (
                          notifications.map((item) => (
                            <Link
                              key={item.id}
                              href={item.href}
                              onClick={() => setNotificationMenuOpen(false)}
                              className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                              role="menuitem"
                            >
                              <div className="flex-shrink-0 mt-0.5">
                                <div className={cn(
                                  'w-8 h-8 rounded-full flex items-center justify-center',
                                  item.type === 'patch-note' ? 'bg-purple-100' :
                                  item.type === 'feedback-new' ? 'bg-yellow-100' : 'bg-blue-100'
                                )}>
                                  {item.type === 'patch-note' ? (
                                    <Megaphone className="w-4 h-4 text-purple-600" />
                                  ) : (
                                    <MessageSquareText className={cn(
                                      'w-4 h-4',
                                      item.type === 'feedback-new' ? 'text-yellow-600' : 'text-blue-600'
                                    )} />
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-700">{item.message}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{getRelativeTime(item.createdAt)}</p>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {!isGuest && user?.name ? (
                <div ref={userMenuRef} className="relative">
                  <button
                    onClick={() => { setUserMenuOpen(!userMenuOpen); setMoreMenuOpen(false); setNotificationMenuOpen(false); }}
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
                onClick={() => { setMobileMenuOpen(!mobileMenuOpen); if (mobileMenuOpen) setSupportMenuOpen(false); }}
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
              {/* 지원 accordion group */}
              <button
                onClick={() => setSupportMenuOpen(!supportMenuOpen)}
                className={cn(
                  'w-full px-3 py-3 rounded-md text-sm font-medium transition-colors flex items-center justify-between',
                  secondaryNavigation.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))
                    ? 'bg-[#153974]/10 text-[#153974] font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
                aria-expanded={supportMenuOpen}
              >
                <span className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  고객 지원
                </span>
                <ChevronDown className={cn('w-4 h-4 transition-transform', supportMenuOpen && 'rotate-180')} />
              </button>
              {supportMenuOpen && (
                <div className="ml-4 flex flex-col gap-1">
                  {secondaryNavigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'px-3 py-2.5 rounded-md text-sm transition-colors flex items-center gap-2',
                          pathname === item.href || pathname.startsWith(item.href + '/')
                            ? 'bg-[#153974]/10 text-[#153974] font-semibold'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              )}
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
