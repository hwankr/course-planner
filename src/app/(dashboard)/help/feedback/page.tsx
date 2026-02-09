'use client';

import Link from 'next/link';
import { ArrowLeft, MessageSquare, Send, CheckCircle } from 'lucide-react';
import { useState } from 'react';

type Category = 'bug' | 'feature' | 'data-error' | 'other';

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: 'bug', label: '버그 신고' },
  { value: 'feature', label: '기능 요청' },
  { value: 'data-error', label: '데이터 오류 (과목/졸업요건 정보 오류)' },
  { value: 'other', label: '기타 문의' },
];

const PLACEHOLDERS: Record<Category, string> = {
  bug: '어떤 문제가 발생했나요? 재현 방법을 알려주시면 더 빨리 해결할 수 있어요.',
  feature: '어떤 기능이 있으면 좋겠나요?',
  'data-error': '어떤 데이터가 잘못되었나요? (과목명, 학과, 졸업요건 등)',
  other: '문의 내용을 자유롭게 작성해주세요.',
};

export default function FeedbackPage() {
  const [category, setCategory] = useState<Category>('bug');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error' | 'rate-limit'
  >('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (content.trim().length < 10) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, email, content }),
      });

      if (response.status === 429) {
        setSubmitStatus('rate-limit');
      } else if (response.ok) {
        setSubmitStatus('success');
        setCategory('bug');
        setEmail('');
        setContent('');
      } else {
        setSubmitStatus('error');
      }
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-3xl px-4 pb-12 pt-6 md:px-6 md:pt-10">
        {/* Header Card */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
          <Link
            href="/help"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#00AACA] transition-colors hover:text-[#153974]"
          >
            <ArrowLeft className="h-4 w-4" />
            도움말로 돌아가기
          </Link>

          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            <MessageSquare className="h-3.5 w-3.5" />
            문의하기
          </div>

          <h1 className="text-3xl font-bold text-[#153974] md:text-4xl">
            문의 및 피드백
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            불편한 점이나 개선 아이디어를 알려주세요
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category Select */}
            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-semibold text-[#153974]"
              >
                카테고리 <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 transition-colors focus:border-[#153974] focus:outline-none focus:ring-2 focus:ring-[#153974]/20"
                required
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-[#153974]"
              >
                이메일{' '}
                <span className="text-xs font-normal text-slate-500">
                  (선택)
                </span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="답변을 받으시려면 이메일을 입력하세요"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 transition-colors focus:border-[#153974] focus:outline-none focus:ring-2 focus:ring-[#153974]/20"
              />
            </div>

            {/* Content Textarea */}
            <div>
              <label
                htmlFor="content"
                className="mb-2 block text-sm font-semibold text-[#153974]"
              >
                내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={PLACEHOLDERS[category]}
                rows={8}
                minLength={10}
                maxLength={2000}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 transition-colors focus:border-[#153974] focus:outline-none focus:ring-2 focus:ring-[#153974]/20"
                required
              />
              <div className="mt-1 text-right text-xs text-slate-500">
                {content.length}/2000
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || content.trim().length < 10}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#153974] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1a4a8f] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  전송 중...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  제출하기
                </>
              )}
            </button>

            {/* Status Messages */}
            {submitStatus === 'success' && (
              <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
                <div className="text-sm text-green-800">
                  <p className="font-semibold">문의가 성공적으로 전송되었습니다!</p>
                  <p className="mt-1 text-xs">
                    영업일 기준 3일 이내에 이메일로 답변드립니다.
                  </p>
                </div>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <p className="font-semibold">문의 전송에 실패했습니다.</p>
                <p className="mt-1 text-xs">
                  잠시 후 다시 시도해주세요. 문제가 계속되면 개발자에게
                  문의해주세요.
                </p>
              </div>
            )}

            {submitStatus === 'rate-limit' && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-semibold">잠시 후 다시 시도해주세요.</p>
                <p className="mt-1 text-xs">
                  너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.
                </p>
              </div>
            )}
          </form>

          {/* Info Message */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              문의에 대한 답변은 영업일 기준 3일 이내에 이메일로 드립니다.
              이메일 주소를 입력하지 않으신 경우 답변을 받으실 수 없습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
