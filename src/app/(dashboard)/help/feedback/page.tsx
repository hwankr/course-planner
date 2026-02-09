'use client';

import Link from 'next/link';
import { ArrowLeft, Mail, MessageSquare, Copy, Check } from 'lucide-react';
import { useState } from 'react';

const EMAIL = 'fabronjeon@gmail.com';

export default function ContactPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-3xl px-4 pb-12 pt-6 md:px-6 md:pt-10">
        <Link
          href="/help"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[#00AACA] transition-colors hover:text-[#153974]"
        >
          <ArrowLeft className="h-4 w-4" />
          도움말로 돌아가기
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 md:p-12">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            <MessageSquare className="h-3.5 w-3.5" />
            Contact
          </div>

          <h1 className="text-2xl font-bold text-[#153974] sm:text-3xl md:text-4xl">
            문의하기
          </h1>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed sm:text-base">
            궁금한 점이나 문의 사항이 있으시면 아래 메일로 연락 주세요.
          </p>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:mt-8 sm:p-5">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#153974] to-[#1a4a8f] sm:h-12 sm:w-12">
                <Mail className="h-5 w-5 text-white sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500 sm:text-sm">이메일</p>
                <p className="truncate text-sm font-semibold text-[#153974] sm:text-lg">
                  {EMAIL}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-600 transition-colors hover:border-[#153974] hover:text-[#153974] sm:mt-4 sm:w-auto cursor-pointer"
              title="이메일 복사"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-green-600">복사됨</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>이메일 복사하기</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
