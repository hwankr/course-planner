/**
 * @api-separable
 * @migration-notes 모바일 앱 분리 시 백엔드 미들웨어로 이동 필요
 * JWT 검증 로직은 백엔드에서 동일하게 작동
 * 보안 헤더는 백엔드 서버 또는 리버스 프록시에서 설정
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { validateCsrf } from '@/lib/csrf';

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProduction = process.env.NODE_ENV === 'production';

  // API 라우트: CSRF 검증 + 보안 헤더만 적용 (라우트 보호 건너뛰기)
  if (pathname.startsWith('/api')) {
    // NextAuth는 자체 CSRF 보호가 있으므로 제외
    if (!pathname.startsWith('/api/auth')) {
      const csrfError = validateCsrf(request);
      if (csrfError) return csrfError;
    }

    const response = NextResponse.next();
    addSecurityHeaders(response, isProduction);
    return response;
  }

  // JWT 토큰 확인 (auth options의 커스텀 쿠키 이름과 일치시킴)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: 'next-auth.session-token',
  });

  // 인증된 사용자가 로그인/회원가입/랜딩 페이지 접근 시 플래너로 리다이렉트
  if (token && (pathname === '/login' || pathname === '/register' || pathname === '/')) {
    return NextResponse.redirect(new URL('/planner', request.url));
  }

  // 보호된 라우트
  const protectedRoutes = ['/planner', '/requirements', '/profile', '/admin', '/onboarding', '/dashboard'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute && !token) {
    // 비회원 모드: guest-mode 쿠키가 있으면 통과
    const isGuestMode = request.cookies.get('guest-mode')?.value === 'true';
    if (isGuestMode) {
      // 보안 헤더만 추가하고 통과
      const response = NextResponse.next();
      addSecurityHeaders(response, isProduction);
      return response;
    }

    // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    const response = NextResponse.redirect(loginUrl);
    addSecurityHeaders(response, isProduction);
    return response;
  }

  // 관리자 전용 라우트 보호
  if (pathname.startsWith('/admin') && token) {
    if (token.role !== 'admin') {
      // 관리자가 아닌 사용자는 플래너로 리다이렉트
      const response = NextResponse.redirect(new URL('/planner', request.url));
      addSecurityHeaders(response, isProduction);
      return response;
    }
  }

  // 보안 헤더 추가
  const response = NextResponse.next();
  addSecurityHeaders(response, isProduction);
  return response;
}

function addSecurityHeaders(response: NextResponse, isProduction: boolean) {
  // 기본 보안 헤더 (모든 환경)
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // HSTS는 프로덕션에서만 활성화
  if (isProduction) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
}

// 프록시가 실행될 경로 설정
export const config = {
  matcher: [
    /*
     * 다음 경로를 제외한 모든 요청에 대해 실행:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico (파비콘)
     * - monitoring (Sentry 터널 라우트)
     * - 정적 에셋 (svg, png, jpg, jpeg, gif, webp)
     *
     * API 라우트는 CSRF 검증을 위해 포함됨
     */
    '/((?!_next/static|_next/image|favicon.ico|monitoring|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
