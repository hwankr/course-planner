/**
 * In-Memory TTL Cache
 * @api-separable
 * @migration-notes 분리 시 백엔드로 이동. Redis로 교체 가능.
 */

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

export class InMemoryCache {
  private store: Map<string, CacheEntry<unknown>>;

  constructor() {
    this.store = new Map();
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, {
      data,
      expiry: Date.now() + ttlMs,
    });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  size(): number {
    return this.store.size;
  }
}

// Dev mode: preserve cache across HMR (same pattern as global.mongooseCache)
declare global {
  var __statisticsCache: InMemoryCache | undefined;
}

export const statsCache: InMemoryCache =
  global.__statisticsCache || new InMemoryCache();

if (!global.__statisticsCache) {
  global.__statisticsCache = statsCache;
}
