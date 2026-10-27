import Link from 'next/link';
import { CopyEmail } from './CopyEmail';

// 흰 바탕 + 위 1px 선, 글자 링크만 (.design-ref/Landing footer)
const LINK = 'inline-flex min-h-11 items-center text-[14px] md:min-h-6 text-ink-2 transition-colors duration-150 ease-out hover:text-ink';
const COLUMN_TITLE = 'mb-1 md:mb-0 text-[13px] font-bold tracking-[0.06em] text-ink';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line-2 bg-white text-ink">
      <div className="mx-auto flex w-full max-w-[1184px] flex-col gap-10 px-5 pt-12 pb-10 md:px-8">
        <div className="flex flex-wrap justify-between gap-10">
          <div className="flex flex-col gap-1.5">
            <Link href="/" className="self-start text-[16px] font-bold tracking-[-0.02em] text-ink">
              YU 수강 플래너
            </Link>
            <span className="text-[14px] leading-5 text-ink-2">YU the Future</span>
            {/* CopyEmail은 공용 컴포넌트라 색만 이 자리에서 덮어쓴다 */}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 [&_button]:text-[13px] [&_button]:text-ink-2 [&_button:hover]:text-ink [&_span]:text-primary">
              <CopyEmail email="fabronjeon@gmail.com" />
              <a
                href="mailto:fabronjeon@gmail.com"
                aria-label="fabronjeon@gmail.com로 메일 보내기"
                className="inline-flex min-h-11 items-center text-[13px] text-ink-2 no-underline transition-colors duration-150 ease-out hover:text-primary md:min-h-6"
              >
                메일 보내기
              </a>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-16 gap-y-10">
            <nav aria-label="서비스" className="flex flex-col md:gap-3">
              <span className={COLUMN_TITLE}>Service</span>
              <Link href="/planner" className={LINK}>수강 계획</Link>
              <Link href="/planner" className={LINK}>졸업 요건 추적</Link>
              <Link href="/statistics" className={LINK}>학과 통계</Link>
              <Link href="/help" className={LINK}>도움말</Link>
            </nav>
            <nav aria-label="지원" className="flex flex-col md:gap-3">
              <span className={COLUMN_TITLE}>Support</span>
              <Link href="/help/feedback" className={LINK}>문의 및 건의</Link>
              <Link href="/patch-notes" className={LINK}>업데이트 소식</Link>
              <a
                href="https://www.yu.ac.kr/main/index.do"
                target="_blank"
                rel="noreferrer"
                className={LINK}
              >
                영남대학교 바로가기
              </a>
            </nav>
            <nav aria-label="약관" className="flex flex-col md:gap-3">
              <span className={COLUMN_TITLE}>Legal</span>
              <Link href="/privacy" className={LINK}>개인정보처리방침</Link>
              <Link href="/terms" className={LINK}>이용약관</Link>
            </nav>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[13px] leading-[18px] text-ink-2">
            {'©'} {new Date().getFullYear()} YU 수강 플래너. All rights reserved.
          </span>
          <span className="text-[12px] leading-4 text-ink-2">이 서비스는 영남대학교 공식 서비스가 아닙니다</span>
        </div>
      </div>
    </footer>
  );
}
