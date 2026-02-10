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
  [/everytime/i, '에브리타임'],
  [/Instagram/i, '인스타그램'],
  [/FBAN|FBAV/i, 'Facebook'],
  [/NAVER/i, '네이버'],
  [/Line\//i, 'LINE'],
  [/DaumApps/i, '다음'],
  [/SamsungBrowser\/.*CrossApp/i, '삼성 인터넷'],
  [/TB\//i, 'Twitter'],
  [/trill/i, 'TikTok'],
  [/Band\//i, '밴드'],
];

/**
 * 일반적인 WebView 감지 (위 패턴에 매칭되지 않는 경우 fallback)
 * Android WebView: 'wv' 플래그 또는 'Version/x.x' + 'Chrome' 조합
 * iOS WebView: Safari 엔진이지만 'Safari/' 문자열이 없는 경우
 */
function isGenericWebView(ua: string): boolean {
  // Android WebView 감지
  if (/Android/i.test(ua)) {
    // 'wv' 플래그는 Android WebView를 나타냄
    if (/; wv\)/.test(ua)) return true;
  }

  // iOS WebView 감지: AppleWebKit은 있지만 Safari가 없는 경우
  if (/iPhone|iPad|iPod/i.test(ua)) {
    if (/AppleWebKit/i.test(ua) && !/Safari\//i.test(ua)) return true;
  }

  return false;
}

export function detectInAppBrowser(userAgent?: string): InAppBrowserInfo {
  if (typeof window === 'undefined') {
    return { isInApp: false, appName: null };
  }

  const ua = userAgent || navigator.userAgent;

  // 1. 알려진 앱 패턴 매칭
  for (const [pattern, name] of IN_APP_PATTERNS) {
    if (pattern.test(ua)) {
      return { isInApp: true, appName: name };
    }
  }

  // 2. 일반적인 WebView 감지 (fallback)
  if (isGenericWebView(ua)) {
    return { isInApp: true, appName: null };
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
