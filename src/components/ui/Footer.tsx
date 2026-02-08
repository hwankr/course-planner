import Image from 'next/image';
import Link from 'next/link';
import { CopyEmail } from './CopyEmail';

const footerLinks = [
  { name: '수강 계획', href: '/planner' },
  { name: '학과 통계', href: '/statistics' },
  { name: '프로필', href: '/profile' },
  { name: '도움말', href: '/help/graduation-guide' },
];

export function Footer() {
  return (
    <footer className="mt-auto">
      <div className="bg-[#0d2654] py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3">
            {/* Brand Column */}
            <div className="text-center md:text-left">
              <Image
                src="/yu-logo-white.svg"
                alt="영남대학교"
                width={120}
                height={48}
                style={{ width: 'auto' }}
                className="h-8 mx-auto md:mx-0"
              />
              <p className="mt-3 text-lg font-bold text-white">YU 수강 플래너</p>
              <p className="mt-1 text-sm text-gray-400">
                영남대학교 학생을 위한 수강 계획 도우미
              </p>
            </div>

            {/* Links Column */}
            <div className="text-center md:text-left">
              <h3 className="text-sm font-semibold text-white">바로가기</h3>
              <ul className="mt-3 space-y-2">
                {footerLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 transition-colors hover:text-white"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Info Column */}
            <div className="text-center md:text-left">
              <h3 className="text-sm font-semibold text-white">정보</h3>
              <div className="mt-3 space-y-2">
                <p className="text-sm text-gray-400">
                  이 서비스는 영남대학교 공식 서비스가 아닙니다
                </p>
                <p className="text-sm text-gray-400">
                  학생 프로젝트로 제작되었습니다
                </p>
                <a
                  href="https://www.yu.ac.kr/main/index.do"
                  target="_blank"
                  rel="noreferrer"
                  className="block text-sm text-[#00AACA]/80 transition-colors hover:text-[#00AACA]"
                >
                  영남대학교 바로가기
                </a>
                <CopyEmail email="fabronjeon@naver.com" />
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 border-t border-white/10 pt-8 text-center md:text-left">
            <p className="text-sm text-gray-500">
              {'\u00A9'} {new Date().getFullYear()} YU 수강 플래너. All rights reserved.
            </p>
          </div>
        </div>
      </div>
      {/* Bottom Gradient Bar */}
      <div className="h-1 bg-gradient-to-r from-[#153974] via-[#3069B3] to-[#00AACA]" />
    </footer>
  );
}
