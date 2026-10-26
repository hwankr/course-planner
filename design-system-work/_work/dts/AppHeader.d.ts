// AppHeader (pattern) — adapted from src/app/(dashboard)/layout.tsx. No component exists; this documents the route layout that renders the shell header inline. Documentation only; not type-checked.

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

/** Props of DashboardLayout, the (dashboard) route layout; the header has no props of its own and reads usePathname() and useAuth(). */
export interface AppHeaderProps {
  /** The page rendered inside <main class="container mx-auto px-3 py-4 sm:px-4 sm:py-8">, wrapped in ErrorBoundary and OnboardingGuard. */
  children: ReactNode;
}

/** One entry of primaryNavigation, secondaryNavigation or adminNavigation. */
export interface NavigationItem {
  /** Visible label: 수강 계획 · 학사 일정 · 학과 통계 · 도움말 · 문의 및 건의 · 업데이트 소식 · 관리자. */
  name: string;
  /** Route; primary pills are current on `pathname === href`, 관리자 on `startsWith(href)`, secondary on `=== href || startsWith(href + '/')`. */
  href: string;
  /** lucide-react icon rendered at w-4 h-4 before the label (Calendar, CalendarDays, BarChart3, HelpCircle, MessageSquareText, Megaphone, Shield). */
  icon: LucideIcon;
}

/** Top-level pills in the desktop nav and the mobile menu: 수강 계획 /planner · 학사 일정 /calendar · 학과 통계 /statistics. */
export declare const primaryNavigation: NavigationItem[];
/** Items of the 더보기 dropdown and the mobile 고객 지원 accordion: 도움말 /help · 문의 및 건의 /help/feedback · 업데이트 소식 /patch-notes. */
export declare const secondaryNavigation: NavigationItem[];
/** The purple 관리자 /admin pill, rendered only when !isGuest && isAdmin. */
export declare const adminNavigation: NavigationItem[];

/** A row of the 알림 panel, as returned by GET /api/notifications in `{ success: boolean; data: NotificationItem[] }`. */
export interface NotificationItem {
  /** React key. */
  id: string;
  /** Picks the chip: 'patch-note' (purple-100 + Megaphone), 'feedback-new' (yellow-100, admins only), anything else such as 'feedback-reply' (blue-100). */
  type: string;
  /** Row text in text-sm text-gray-700, e.g. 새로운 업데이트: {title} · 문의에 답변이 달렸습니다. */
  message: string;
  /** Link target of the row; the panel closes on click. */
  href: string;
  /** ISO timestamp rendered through getRelativeTime(). */
  createdAt: string;
}

/** Shape of GET /api/notifications/unread-count; the badge shows `count`, capped at 99+ and coloured by role. */
export interface UnreadCountResponse {
  /** Request status. */
  success: boolean;
  /** Unread notifications for the signed-in user. */
  data: { count: number };
}

/** What the header reads from useAuth(). */
export interface AppHeaderAuthState {
  /** next-auth session user (`session?.user`, undefined without a session); `name` drives the avatar initial and the user menu, `role === 'admin'` yields isAdmin. */
  user?: { id: string; email: string; name: string; image?: string; role?: 'student' | 'admin' };
  /** True once the session status is 'authenticated'; gates the bell and the notification queries. */
  isAuthenticated: boolean;
  /** Shows the 관리자 pill and turns the badge yellow-400 / yellow-900. */
  isAdmin: boolean;
  /** Guest mode: swaps the bell and user menu for 구글 로그인 / 회원가입 Buttons and renders the amber banner. */
  isGuest: boolean;
  /** 로그아웃 item and the fallback ghost Button; exits guest mode or signs out and routes away. */
  logout: () => Promise<void>;
  /** 구글 로그인 Button and the banner's 구글로 로그인 link; exits guest mode, then signIn('google'). */
  loginWithGoogle: () => Promise<void>;
}

/** 방금 전 · N분 전 · N시간 전 · N일 전 (under 7 days) · otherwise toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }). */
export declare function getRelativeTime(dateStr: string): string;

/** Client component ('use client'). Keeps mobileMenuOpen, moreMenuOpen, userMenuOpen, notificationMenuOpen and supportMenuOpen; closes the three dropdowns on outside mousedown or Escape. */
export default function DashboardLayout(props: AppHeaderProps): JSX.Element;
