/**
 * CSRF Protection via Origin/Referer header validation
 * @api-separable
 * @migration-notes Express 변환 시: CORS 미들웨어로 대체
 */

import { NextResponse } from 'next/server';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * Validate that the request Origin matches the expected host.
 * Returns null if valid, or an error Response if invalid.
 */
export function validateCsrf(request: Request): Response | null {
  // Safe methods don't need CSRF validation
  if (SAFE_METHODS.includes(request.method)) {
    return null;
  }

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  // At least one of origin or referer must be present
  if (!origin && !referer) {
    // Allow requests without origin/referer (e.g., server-to-server, Postman)
    // In production, you might want to block these
    return null;
  }

  // Validate origin against host
  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) {
        return NextResponse.json(
          { success: false, error: '잘못된 요청입니다.' },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json(
        { success: false, error: '잘못된 요청입니다.' },
        { status: 403 }
      );
    }
  } else if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.host !== host) {
        return NextResponse.json(
          { success: false, error: '잘못된 요청입니다.' },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json(
        { success: false, error: '잘못된 요청입니다.' },
        { status: 403 }
      );
    }
  }

  return null; // Valid
}
