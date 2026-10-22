// AuthLayout — a PATTERN, not a component: shapes adapted from src/app/(auth)/login/page.tsx,
// src/app/(auth)/register/page.tsx, src/lib/inapp-browser.ts and src/lib/auth/login-message.ts.
// Documentation only; not type-checked. The two pages reuse ButtonProps and InputProps (see Button.d.ts, Input.d.ts).

/** Both pages are default-exported, prop-less client components; nothing configures the layout from outside. */
export interface AuthLayoutProps {}

/** Local state of LoginPage (useState). */
export interface LoginPageState {
  /** Controlled value of the 이메일 field; default ''. */
  email: string;
  /** Controlled value of the 비밀번호 field; default ''. */
  password: string;
  /** Message shown in the red alert above the fields; '' hides it. Set to LOGIN_FAILURE_MESSAGE when login() throws. */
  error: string;
  /** True from submit until login() settles; combined with useAuth().isLoading into Button isLoading. */
  isSubmitting: boolean;
  /** detectInAppBrowser() result plus an iOS flag; when isInApp the Google button is replaced by the amber notice. */
  inAppInfo: InAppBrowserInfo & { isIOS: boolean };
}

/** Return shape of detectInAppBrowser() in src/lib/inapp-browser.ts (the interface is module-private there). */
export interface InAppBrowserInfo {
  /** True inside a known in-app WebView (KakaoTalk, Everytime, Instagram, Facebook, NAVER, LINE, Daum, Samsung CrossApp, Twitter, TikTok, Band) or a generic WebView. */
  isInApp: boolean;
  /** Korean/English app name for the notice (카카오톡, 에브리타임, 인스타그램, Facebook, 네이버, LINE, 다음, 삼성 인터넷, Twitter, TikTok, 밴드); null for a generic WebView, rendered as '앱'. */
  appName: string | null;
}

/** Controlled form values of RegisterPage, keyed by the <input name>. */
export interface RegisterFormData {
  /** 이름 field; placeholder 홍길동. */
  name: string;
  /** 이메일 field; placeholder email@example.com. */
  email: string;
  /** 비밀번호 field; must match /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).{8,}$/ before submit. */
  password: string;
  /** 비밀번호 확인 field; must equal password before submit. */
  confirmPassword: string;
}

/** Local state of RegisterPage. */
export interface RegisterPageState {
  /** The four controlled values. */
  formData: RegisterFormData;
  /** Alert text: 비밀번호가 일치하지 않습니다. | 비밀번호는 8자 이상이며, 대문자, 소문자, 숫자를 포함해야 합니다. | err.message | 회원가입에 실패했습니다.; '' hides it. */
  error: string;
  /** True from submit until register() settles. */
  isSubmitting: boolean;
}

/** The part of useAuth() (src/hooks/useAuth.ts) these pages consume. */
export interface AuthLayoutAuthHook {
  /** Credentials sign-in through NextAuth; throws Error(LOGIN_FAILURE_MESSAGE) on failure, then routes to /planner. */
  login(email: string, password: string): Promise<void>;
  /** signIn('google', { callbackUrl: '/planner' }) after exitGuestMode(); full-page redirect. */
  loginWithGoogle(): Promise<void>;
  /** POST /api/auth/register then login(); throws Error(result.error) when success is false. */
  register(data: { email: string; password: string; name: string }): Promise<void>;
  /** True while the NextAuth session status is 'loading'; feeds Button isLoading. */
  isLoading: boolean;
}

/** The one login error string, from src/lib/auth/login-message.ts. */
export declare const LOGIN_FAILURE_MESSAGE: '이메일 또는 비밀번호가 올바르지 않습니다. 잠시 후 다시 시도해주세요.';

/** Client page component ('use client'); root <div className="min-h-screen flex">. */
export default function LoginPage(): JSX.Element;

/** Client page component ('use client'); root <div className="flex-1 flex">. Separately default-exported from register/page.tsx. */
export declare function RegisterPage(): JSX.Element;
