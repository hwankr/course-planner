/**
 * 인앱 브라우저(WebView) 감지 및 외부 브라우저 리다이렉트 유틸리티
 *
 * 카카오톡, 인스타그램 등 인앱 브라우저에서 Google OAuth가
 * disallowed_useragent 오류로 차단되는 문제를 해결합니다.
 */

interface InAppBrowserInfo {
  isInApp: boolean;
  appName: string | null;
}

const IN_APP_PATTERNS: [RegExp, string][] = [
  [/KAKAOTALK/i, '카카오톡'],
  [/Instagram/i, '인스타그램'],
  [/FBAN|FBAV/i, 'Facebook'],
  [/NAVER/i, '네이버'],
  [/Line\//i, 'LINE'],
  [/DaumApps/i, '다음'],
  [/SamsungBrowser\/.*CrossApp/i, '삼성 인터넷'],
  [/TB\//i, 'Twitter'],
];

export function detectInAppBrowser(userAgent?: string): InAppBrowserInfo {
  if (typeof window === 'undefined') {
    return { isInApp: false, appName: null };
  }

  const ua = userAgent || navigator.userAgent;

  for (const [pattern, name] of IN_APP_PATTERNS) {
    if (pattern.test(ua)) {
      return { isInApp: true, appName: name };
    }
  }

  return { isInApp: false, appName: null };
}

/**
 * 현재 페이지를 외부 브라우저에서 열기 시도
 * Android: intent:// 스킴으로 Chrome 실행
 * iOS: 안내 메시지만 표시 (프로그래밍 방식 불가)
 */
export function openInExternalBrowser(url?: string): 'redirected' | 'ios' | 'unknown' {
  const targetUrl = url || window.location.href;
  const ua = navigator.userAgent;

  // Android: intent scheme으로 Chrome 열기
  if (/Android/i.test(ua)) {
    const intentUrl = `intent://${targetUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
    window.location.href = intentUrl;
    return 'redirected';
  }

  // iOS: 프로그래밍 방식으로 Safari 열기 불가
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return 'ios';
  }

  return 'unknown';
}
