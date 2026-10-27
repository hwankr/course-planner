/** Only same-origin root-relative destinations can be used after authentication. */
export function safeCallbackUrl(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020\u007f]/.test(value)) return '/planner';
  try {
    const base = 'https://callback.invalid';
    const url = new URL(value, base);
    if (url.origin !== base || url.pathname.startsWith('//') || /^\/(login|register)(\/|$)/.test(url.pathname)) return '/planner';
    return url.pathname + url.search + url.hash;
  } catch { return '/planner'; }
}

export function isPublicPage(pathname: string): boolean {
  return ['/help', '/patch-notes', '/privacy', '/terms'].some(path => pathname === path || pathname.startsWith(path + '/'))
    || pathname === '/calendar' || pathname === '/statistics';
}
