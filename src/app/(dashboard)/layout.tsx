'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useDepartments } from '@/hooks/useOnboarding';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Toast } from '@/components/ui';
import { cn } from '@/lib/utils';
import OnboardingGuard from '@/components/providers/OnboardingGuard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Bell,
  BarChart3,
  Calendar,
  CalendarDays,
  CalendarCheck,
  ChevronRight,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react';

const primaryNavigation: { name: string; href: string; icon: LucideIcon }[] = [
  { name: '수강 계획', href: '/planner', icon: Calendar },
  { name: '학사 일정', href: '/calendar', icon: CalendarDays },
  { name: '학과 통계', href: '/statistics', icon: BarChart3 },
];

const secondaryNavigation = [
  { name: '도움말', href: '/help' },
  { name: '문의 및 건의', href: '/help/feedback' },
  { name: '업데이트 소식', href: '/patch-notes' },
];

const adminNavigation = [{ name: '관리자', href: '/admin' }];

// 모바일 하단 탭: 앞 세 개는 화면 이동, 네 번째 "전체"는 프로필·2차 메뉴·관리자·로그아웃을 담은 바텀 시트를 연다.
const mobileTabs: { name: string; href: string; icon: LucideIcon }[] = [
  { name: '수강 계획', href: '/planner', icon: CalendarCheck },
  { name: '학사 일정', href: '/calendar', icon: CalendarDays },
  { name: '학과 통계', href: '/statistics', icon: BarChart3 },
];

/** "전체" 탭이 활성으로 보이는 경로 (시트 안 항목들의 화면) */
const allMenuPaths = ['/profile', '/help', '/patch-notes', '/admin'];

// 모바일 상단바 제목. 가장 구체적인(긴) 경로가 우선한다.
const mobilePageTitles: Record<string, string> = {
  '/planner': '수강 계획',
  '/calendar': '학사 일정',
  '/statistics': '학과 통계',
  '/profile': '프로필',
  '/help': '도움말',
  '/help/feedback': '문의 및 건의',
  '/help/graduation-guide': '졸업 가이드',
  '/patch-notes': '업데이트 소식',
  '/admin': '관리자',
};

/** 자체 h1을 가진 화면: 모바일 상단바는 제목 대신 워드마크를 보여 제목 중복을 피한다. */
const mobileWordmarkPaths = ['/onboarding'];

/** 하단 탭·"전체" 시트가 사라지는 데스크톱 breakpoint(Tailwind md) */
const desktopMediaQuery = '(min-width: 768px)';

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

function getNotificationTypeLabel(type: string): string {
  if (type === 'patch-note') return '업데이트';
  if (type === 'feedback-new') return '새 문의';
  return '문의 답변';
}

function matchesPath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + '/');
}

/** 여러 항목이 겹쳐 매칭될 때(/help 와 /help/feedback) 가장 구체적인 href 하나만 활성으로 본다. */
function getActiveHref(pathname: string, hrefs: string[]): string | undefined {
  return hrefs
    .filter((href) => matchesPath(pathname, href))
    .sort((a, b) => b.length - a.length)[0];
}

function getMobilePageTitle(pathname: string): string {
  const href = getActiveHref(pathname, Object.keys(mobilePageTitles));
  return href ? mobilePageTitles[href] : 'YU 수강 플래너';
}

interface NotificationMenuProps {
  variant: 'sidebar' | 'header';
  unreadCount: number;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onOpenChange: (open: boolean) => void;
}

/**
 * 알림 트리거 + 드롭다운. 데스크톱 사이드바와 모바일 상단바에 각각 하나씩 렌더링되므로
 * 열림 상태와 바깥 클릭 처리를 인스턴스마다 따로 가진다.
 */
function NotificationMenu({ variant, unreadCount, notifications, onMarkAllRead, onOpenChange }: NotificationMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const setMenuOpen = (next: boolean) => {
    setOpen(next);
    onOpenChange(next);
  };

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
        onOpenChange(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        onOpenChange(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  const countLabel = unreadCount > 99 ? '99+' : String(unreadCount);
  const ariaLabel = unreadCount > 0 ? `알림, 읽지 않음 ${countLabel}개` : '알림';

  return (
    <div ref={ref} className="relative">
      {variant === 'sidebar' ? (
        <button
          type="button"
          onClick={() => setMenuOpen(!open)}
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-haspopup="true"
          className={cn(
            'flex h-9 w-full items-center justify-between rounded-[8px] px-3 text-[14px] font-medium transition-colors duration-150 ease-out',
            open ? 'bg-fill text-ink' : 'text-ink-2 hover:text-ink'
          )}
        >
          <span>알림</span>
          {unreadCount > 0 && (
            <span className="text-[13px] font-semibold tabular-nums text-primary">{countLabel}</span>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setMenuOpen(!open)}
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-haspopup="true"
          className="inline-flex h-11 min-w-11 items-center justify-center gap-1 px-2.5 text-ink"
        >
          <Bell aria-hidden="true" className="h-[22px] w-[22px]" strokeWidth={2} />
          {unreadCount > 0 && (
            <span className="text-[13px] font-semibold tabular-nums text-primary">{countLabel}</span>
          )}
        </button>
      )}

      {open && (
        <div
          role="menu"
          aria-label="알림"
          className={cn(
            'z-50 overflow-hidden rounded-none border border-line-2 bg-white shadow-float',
            variant === 'sidebar'
              ? 'absolute bottom-0 left-full ml-3 w-80'
              : 'fixed left-5 right-5 top-[56px]'
          )}
        >
          <div className="flex h-[52px] items-center justify-between border-b border-line px-4">
            <span className="text-[15px] font-bold tracking-[-0.02em] text-ink">알림</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => onMarkAllRead()}
                className="-mr-2 h-9 rounded-[8px] px-2 text-[13px] font-semibold text-primary transition-colors duration-150 hover:text-primary-hover"
              >
                모두 읽음
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="m-0 px-4 py-8 text-center text-[13px] leading-[18px] text-ink-2">알림이 없습니다.</p>
            ) : (
              notifications.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-[56px] flex-col justify-center gap-0.5 border-b border-line px-4 py-2.5 transition-colors duration-150 last:border-b-0 hover:bg-fill"
                  role="menuitem"
                >
                  <span className="text-[14px] leading-5 font-medium text-ink">{item.message}</span>
                  <span className="text-[12px] leading-4 text-ink-2">
                    {getNotificationTypeLabel(item.type)} · {getRelativeTime(item.createdAt)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface AllMenuSheetProps {
  onClose: () => void;
  /** 닫힐 때 포커스를 돌려줄 트리거("전체" 탭) */
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  isGuest: boolean;
  userName?: string;
  departmentName?: string;
  isProfileActive: boolean;
  items: { name: string; href: string }[];
  activeHref?: string;
  onLogin: () => void;
  onLogout: () => void;
}

const sheetRowClass =
  'flex h-[52px] w-full items-center gap-3 border-b border-line text-left text-[15px] transition-colors duration-150 last:border-b-0';

/**
 * 모바일 "전체" 바텀 시트. 하단 탭바까지 덮고, 바깥 클릭·Escape로 닫힌다.
 * 바깥 클릭은 투명 백드롭이 받아서 아래 화면 요소가 함께 눌리지 않게 한다.
 */
function AllMenuSheet({
  onClose,
  triggerRef,
  isGuest,
  userName,
  departmentName,
  isProfileActive,
  items,
  activeHref,
  onLogin,
  onLogout,
}: AllMenuSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sheet = sheetRef.current;
    const trigger = triggerRef.current;
    sheet?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      // aria-modal: Tab 포커스를 시트 안에 가둔다.
      if (event.key !== 'Tab' || !sheet) return;
      const focusables = sheet.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === sheet)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      trigger?.focus();
    };
  }, [onClose, triggerRef]);

  // 시트는 md:hidden으로만 숨겨지므로 화면 회전·창 확대로 md 이상이 되면 닫아서 스크롤 잠금을 푼다.
  useEffect(() => {
    const mediaQuery = window.matchMedia(desktopMediaQuery);
    if (mediaQuery.matches) {
      onClose();
      return;
    }
    function handleChange(event: MediaQueryListEvent) {
      if (event.matches) onClose();
    }
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [onClose]);

  return (
    <>
      <div aria-hidden="true" onClick={onClose} className="fixed inset-0 z-50 md:hidden" />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="전체 메뉴"
        tabIndex={-1}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-none border-t border-line-2 bg-white pb-6 shadow-float focus:outline-none md:hidden"
      >
        <div className="flex h-[52px] items-center justify-between pl-5 pr-2">
          <span className="text-[16px] font-bold tracking-[-0.02em] text-ink">전체</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="inline-flex h-11 w-11 items-center justify-center text-ink-2 transition-colors duration-150 hover:text-ink"
          >
            <X aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <div className="px-5">
          {isGuest ? (
            <div className="flex min-h-[60px] items-center gap-3 border-b border-line">
              <Link
                href="/profile"
                onClick={onClose}
                aria-current={isProfileActive ? 'page' : undefined}
                className="flex min-w-0 flex-1 flex-col justify-center gap-px py-2"
              >
                <span className="text-[14px] font-semibold text-ink">비회원</span>
                <span className="truncate text-[12px] leading-4 text-ink-2">데이터가 이 브라우저에만 저장돼요</span>
              </Link>
              <button
                type="button"
                onClick={onLogin}
                className="h-11 shrink-0 pl-2 text-[14px] font-semibold text-primary transition-colors duration-150 hover:text-primary-hover"
              >
                로그인
              </button>
            </div>
          ) : (
            <Link
              href="/profile"
              onClick={onClose}
              aria-current={isProfileActive ? 'page' : undefined}
              className="flex min-h-[60px] items-center gap-3 border-b border-line py-2 text-ink"
            >
              <span
                aria-hidden="true"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-fill text-[12px] font-bold text-ink"
              >
                {userName?.charAt(0) ?? ''}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-px">
                <span className="truncate text-[14px] font-semibold">{userName ?? '프로필'}</span>
                {departmentName && (
                  <span className="truncate text-[12px] leading-4 text-ink-2">{departmentName}</span>
                )}
              </span>
              <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-2" strokeWidth={2} />
            </Link>
          )}
        </div>

        <div aria-hidden="true" className="h-2.5 bg-fill" />

        <div className="px-5">
          {items.map((item) => {
            const active = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className={cn(sheetRowClass, 'text-ink', active ? 'font-semibold' : 'font-medium')}
              >
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-2" strokeWidth={2} />
              </Link>
            );
          })}
        </div>

        <div aria-hidden="true" className="h-2.5 bg-fill" />

        <div className="px-5">
          {isGuest ? (
            <Link href="/register" onClick={onClose} className={cn(sheetRowClass, 'font-medium text-ink-2 hover:text-ink')}>
              회원가입
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className={cn(sheetRowClass, 'font-medium text-ink-2 hover:text-ink')}
            >
              로그아웃
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, isAdmin, isGuest, isAuthenticated, loginWithGoogle } = useAuth();
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [allMenuOpen, setAllMenuOpen] = useState(false);
  const allMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const closeAllMenu = useCallback(() => setAllMenuOpen(false), []);
  const queryClient = useQueryClient();
  const { data: departments } = useDepartments();

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

  const showNotifications = !isGuest && isAuthenticated;
  const showAdmin = !isGuest && isAdmin;
  const secondaryItems = showAdmin ? [...secondaryNavigation, ...adminNavigation] : secondaryNavigation;
  const activeSecondaryHref = getActiveHref(pathname, secondaryItems.map((item) => item.href));
  const departmentName = user?.department
    ? departments?.find((dept) => dept._id === user.department)?.name
    : undefined;
  const isProfileActive = matchesPath(pathname, '/profile');
  const isAllMenuActive = allMenuPaths.some((href) => matchesPath(pathname, href));

  const notificationMenuProps = {
    unreadCount,
    notifications,
    onMarkAllRead: () => markAllRead(),
    onOpenChange: setNotificationMenuOpen,
  };

  return (
    <div className="min-h-screen bg-white md:flex">
      {/* Desktop sidebar */}
      <nav
        aria-label="주 메뉴"
        className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-[232px] md:shrink-0 md:flex-col md:gap-7 md:border-r md:border-line md:px-4 md:py-7"
      >
        <Link
          href="/planner"
          className="inline-flex h-9 items-center px-3 text-[16px] font-bold tracking-[-0.02em] text-ink"
        >
          YU 수강 플래너
        </Link>

        <div className="flex flex-col gap-0.5">
          {primaryNavigation.map((item) => {
            const Icon = item.icon;
            const active = matchesPath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-10 items-center gap-2.5 rounded-[8px] px-3 text-[15px] transition-colors duration-150 ease-out',
                  active ? 'bg-fill font-semibold text-ink' : 'font-medium text-ink-2 hover:text-ink'
                )}
              >
                <Icon aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={2} />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="flex flex-col gap-0.5 border-t border-line pt-5">
          {secondaryItems.map((item) => {
            const active = item.href === activeSecondaryHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-9 items-center rounded-[8px] px-3 text-[14px] transition-colors duration-150 ease-out',
                  active ? 'bg-fill font-semibold text-ink' : 'font-medium text-ink-2 hover:text-ink'
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="mt-auto flex flex-col gap-0.5">
          {showNotifications && <NotificationMenu variant="sidebar" {...notificationMenuProps} />}

          {isGuest ? (
            <div className="flex flex-col gap-0.5 border-t border-line pt-4">
              <Link
                href="/profile"
                aria-current={isProfileActive ? 'page' : undefined}
                className={cn(
                  'flex min-h-12 flex-col justify-center gap-px rounded-[8px] px-3 py-1.5 transition-colors duration-150',
                  isProfileActive ? 'bg-fill' : 'hover:bg-fill'
                )}
              >
                <span className="text-[14px] font-semibold text-ink">비회원</span>
                <span className="text-[12px] leading-4 text-ink-2">데이터가 이 브라우저에만 저장돼요</span>
              </Link>
              <button
                type="button"
                onClick={loginWithGoogle}
                className="flex h-9 items-center rounded-[8px] px-3 text-left text-[14px] font-semibold text-primary transition-colors duration-150 hover:text-primary-hover"
              >
                구글로 로그인
              </button>
              <Link
                href="/register"
                className="flex h-9 items-center rounded-[8px] px-3 text-[14px] font-medium text-ink-2 transition-colors duration-150 hover:text-ink"
              >
                회원가입
              </Link>
            </div>
          ) : (
            <>
              <Link
                href="/profile"
                aria-current={isProfileActive ? 'page' : undefined}
                className={cn(
                  'flex h-12 items-center gap-2.5 rounded-[8px] px-3 text-ink transition-colors duration-150',
                  isProfileActive ? 'bg-fill' : 'hover:bg-fill'
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-ink',
                    isProfileActive ? 'bg-white' : 'bg-fill'
                  )}
                >
                  {user?.name?.charAt(0) ?? ''}
                </span>
                <span className="flex min-w-0 flex-col gap-px">
                  <span className="truncate text-[14px] font-semibold">{user?.name ?? '프로필'}</span>
                  {departmentName && (
                    <span className="truncate text-[12px] leading-4 text-ink-2">{departmentName}</span>
                  )}
                </span>
              </Link>
              <button
                type="button"
                onClick={logout}
                className="flex h-9 items-center rounded-[8px] px-3 text-left text-[14px] font-medium text-ink-2 transition-colors duration-150 hover:text-ink"
              >
                로그아웃
              </button>
            </>
          )}
        </div>
      </nav>

      <div className="min-w-0 flex-1">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-[52px] items-center justify-between gap-2 bg-white pl-5 pr-3 md:hidden">
          {mobileWordmarkPaths.some((href) => matchesPath(pathname, href)) ? (
            <span className="min-w-0 truncate text-[16px] font-bold tracking-[-0.02em] text-ink">YU 수강 플래너</span>
          ) : (
            <h1 className="m-0 min-w-0 truncate text-[18px] leading-[26px] font-bold tracking-[-0.02em] text-ink">
              {getMobilePageTitle(pathname)}
            </h1>
          )}
          {showNotifications ? (
            <NotificationMenu variant="header" {...notificationMenuProps} />
          ) : isGuest ? (
            <button
              type="button"
              onClick={loginWithGoogle}
              className="h-11 px-3 text-[14px] font-semibold text-primary transition-colors duration-150 hover:text-primary-hover"
            >
              로그인
            </button>
          ) : null}
        </header>

        {/* Guest notice (mobile — desktop shows it in the sidebar) */}
        {isGuest && (
          <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 px-5 pb-2 text-[13px] leading-[18px] text-ink-2 md:hidden">
            <span>비회원으로 이용 중이에요</span>
            <Link href="/register" className="font-semibold text-primary hover:text-primary-hover">
              회원가입
            </Link>
          </p>
        )}

        <main className="mx-auto w-full max-w-[1180px] px-5 pt-2 pb-10 md:px-12 md:pt-9 md:pb-[72px] md:mx-0">
          <ErrorBoundary>
            <OnboardingGuard>{children}</OnboardingGuard>
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile tab bar */}
      <nav
        aria-label="하단 탭"
        data-mobile-tabbar
        className="fixed inset-x-0 bottom-0 z-40 grid h-[84px] grid-cols-4 gap-1 border-t border-line bg-white px-2 pt-1.5 pb-6 md:hidden"
      >
        {mobileTabs.map((tab) => {
          const Icon = tab.icon;
          const active = matchesPath(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-[52px] flex-col items-center justify-center gap-1 text-[12px] transition-colors duration-150',
                active ? 'font-semibold text-ink' : 'font-medium text-ink-2'
              )}
            >
              <Icon aria-hidden="true" className="h-[22px] w-[22px]" strokeWidth={2} />
              {tab.name}
            </Link>
          );
        })}
        <button
          ref={allMenuTriggerRef}
          type="button"
          onClick={() => setAllMenuOpen((open) => !open)}
          aria-haspopup="dialog"
          aria-expanded={allMenuOpen}
          className={cn(
            'flex min-h-[52px] flex-col items-center justify-center gap-1 text-[12px] transition-colors duration-150',
            isAllMenuActive || allMenuOpen ? 'font-semibold text-ink' : 'font-medium text-ink-2'
          )}
        >
          <Menu aria-hidden="true" className="h-[22px] w-[22px]" strokeWidth={2} />
          전체
        </button>
      </nav>

      {allMenuOpen && (
        <AllMenuSheet
          onClose={closeAllMenu}
          triggerRef={allMenuTriggerRef}
          isGuest={isGuest}
          userName={user?.name}
          departmentName={departmentName}
          isProfileActive={isProfileActive}
          items={secondaryItems}
          activeHref={activeSecondaryHref}
          onLogin={loginWithGoogle}
          onLogout={logout}
        />
      )}

      {/* Toast Notifications */}
      <Toast />
    </div>
  );
}
