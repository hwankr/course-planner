import Image from 'next/image';
import Link from 'next/link';
import { Github, Instagram, Mail } from 'lucide-react';
import { CopyEmail } from './CopyEmail';

export function Footer() {
  return (
    <footer className="mt-auto">
      {/* Gradient line at top */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#3069B3] to-transparent"></div>

      <div className="bg-[#0d2654] pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Image
                  src="/yu-logo-white.svg"
                  alt="영남대학교"
                  width={120}
                  height={48}
                  style={{ width: 'auto' }}
                  className="h-6"
                />
                <span className="font-bold text-lg text-white">YU 수강 플래너</span>
              </Link>
              <p className="text-gray-400 text-sm leading-relaxed mb-3">
                
              </p>
              <CopyEmail email="fabronjeon@gmail.com" />
            </div>

            {/* Service Column */}
            <div>
              <h4 className="text-xs font-semibold text-white tracking-widest uppercase mb-5">Service</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><Link href="/planner" className="hover:text-[#00AACA] transition-colors">수강 계획</Link></li>
                <li><Link href="/planner" className="hover:text-[#00AACA] transition-colors">졸업 요건 추적</Link></li>
                <li><Link href="/statistics" className="hover:text-[#00AACA] transition-colors">학과 통계</Link></li>
                <li><Link href="/help" className="hover:text-[#00AACA] transition-colors">도움말</Link></li>
              </ul>
            </div>

            {/* Support Column */}
            <div>
              <h4 className="text-xs font-semibold text-white tracking-widest uppercase mb-5">Support</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><Link href="/help/feedback" className="hover:text-[#00AACA] transition-colors">문의 및 건의</Link></li>
                <li>
                  <a
                    href="https://www.yu.ac.kr/main/index.do"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[#00AACA] transition-colors"
                  >
                    영남대학교 바로가기
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h4 className="text-xs font-semibold text-white tracking-widest uppercase mb-5">Legal</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><Link href="/privacy" className="hover:text-[#00AACA] transition-colors">개인정보처리방침</Link></li>
                <li><Link href="/terms" className="hover:text-[#00AACA] transition-colors">이용약관</Link></li>
              </ul>
              <p className="mt-4 text-xs text-gray-500 leading-relaxed">
                이 서비스는 영남대학교 공식 서비스가 아닙니다
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-500">
              {'\u00A9'} {new Date().getFullYear()} YU 수강 플래너. All rights reserved.
            </p>
            <div className="flex space-x-5">
              <a href="mailto:fabronjeon@gmail.com" className="text-gray-500 hover:text-white transition-colors"><Mail className="w-4 h-4" /></a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient Bar */}
      <div className="h-1 bg-gradient-to-r from-[#153974] via-[#3069B3] to-[#00AACA]" />
    </footer>
  );
}
