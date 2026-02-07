/**
 * In-memory Rate Limiter
 * @api-separable
 * @migration-notes 분리 시 Redis 기반으로 교체 권장
 */

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export function createRateLimiter(options: { windowMs: number; max: number }) {
  const store = new Map<string, RateLimitRecord>();

  // Cleanup expired entries every minute
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (record.resetTime <= now) {
        store.delete(key);
      }
    }
  }, 60000);

  return {
    check(identifier: string): RateLimitResult {
      const now = Date.now();
      const record = store.get(identifier);

      if (!record || record.resetTime <= now) {
        // New window or expired
        const resetTime = now + options.windowMs;
        store.set(identifier, { count: 1, resetTime });
        return {
          success: true,
          remaining: options.max - 1,
          resetAt: resetTime,
        };
      }

      // Within window
      if (record.count < options.max) {
        record.count++;
        return {
          success: true,
          remaining: options.max - record.count,
          resetAt: record.resetTime,
        };
      }

      // Rate limit exceeded
      return {
        success: false,
        remaining: 0,
        resetAt: record.resetTime,
      };
    },
  };
}

// Pre-configured limiters
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15분
  max: 20 // 20회
});

export const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1분
  max: 60 // 60회
});

// Helper to get IP from request
export function getClientIp(request: Request): string {
  // Check various headers for client IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  // Fallback to unknown
  return 'unknown';
}

// Helper to return rate limit response
export function rateLimitResponse(): Response {
  return Response.json(
    {
      success: false,
      error: '요청 횟수 제한을 초과했습니다. 잠시 후 다시 시도해주세요.'
    },
    { status: 429 }
  );
}
