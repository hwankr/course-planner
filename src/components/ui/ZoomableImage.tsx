'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ZoomableImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  /** next/image sizes (썸네일) */
  sizes?: string;
}

/** 도움말 스크린샷: 테두리 1px Line2, 모서리 0, 누르면 전체 화면으로 확대 */
export default function ZoomableImage({
  src,
  alt,
  width,
  height,
  className = '',
  sizes = '(max-width: 768px) 100vw, 720px',
}: ZoomableImageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const trigger = triggerRef.current;
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      } else if (event.key === 'Tab') {
        // 모달 안의 조작 요소는 닫기 버튼 하나 — 포커스를 그 안에 묶어둔다
        event.preventDefault();
        closeRef.current?.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      // 닫히면 확대를 연 썸네일 버튼으로 포커스를 돌려준다
      trigger?.focus();
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={`${alt} 확대 보기`}
        className="group relative block w-full cursor-zoom-in border border-line-2 bg-white p-0 text-left"
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          className={cn('block h-auto w-full', className)}
        />
        <span
          aria-hidden="true"
          className="absolute right-0 bottom-0 bg-ink/80 px-2 py-1 text-[12px] leading-4 font-medium text-white transition-opacity duration-150 ease-out md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100"
        >
          <span className="md:hidden">탭하여 확대</span>
          <span className="hidden md:inline">클릭하여 확대</span>
        </span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setIsOpen(false)}
        >
          <button
            ref={closeRef}
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute top-3 right-3 z-10 flex h-11 w-11 cursor-pointer items-center justify-center rounded-[10px] text-white transition-colors duration-150 ease-out hover:bg-white/15"
            aria-label="닫기"
          >
            <X aria-hidden="true" className="h-6 w-6" />
          </button>

          {/* Scrollable/zoomable image container */}
          <div
            className="max-h-full max-w-full touch-pan-x touch-pan-y overflow-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <Image
              src={src}
              alt={alt}
              width={width}
              height={height}
              className="h-auto w-auto max-w-none"
              quality={100}
              priority
            />
          </div>

          <p className="absolute bottom-4 left-1/2 m-0 -translate-x-1/2 text-[13px] leading-[18px] text-white/80">
            이미지를 드래그하여 이동하세요
          </p>
        </div>
      )}
    </>
  );
}
