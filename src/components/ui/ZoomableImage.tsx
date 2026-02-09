'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ZoomIn, X } from 'lucide-react';

interface ZoomableImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export default function ZoomableImage({
  src,
  alt,
  width,
  height,
  className = '',
}: ZoomableImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Thumbnail with tap hint */}
      <div className="relative group cursor-pointer" onClick={handleOpen}>
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={className}
        />

        {/* Mobile tap hint overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/10 md:hidden">
          <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-[11px] text-white/80">
            <ZoomIn className="h-3 w-3" />
            탭하여 확대
          </div>
        </div>

        {/* Desktop hover hint */}
        <div className="absolute inset-0 hidden items-center justify-center bg-black/0 transition-all group-hover:bg-black/10 md:flex">
          <div className="flex items-center gap-2 rounded-full bg-[#153974]/90 px-4 py-2 text-sm font-medium text-white shadow-lg opacity-0 transition-opacity group-hover:opacity-100">
            <ZoomIn className="h-4 w-4" />
            클릭하여 확대
          </div>
        </div>
      </div>

      {/* Fullscreen modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-200"
          onClick={handleClose}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:bg-white/30"
            aria-label="닫기"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Scrollable/zoomable image container */}
          <div
            className="max-h-full max-w-full overflow-auto touch-pan-x touch-pan-y"
            onClick={(e) => e.stopPropagation()}
            style={{
              WebkitOverflowScrolling: 'touch',
            }}
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

          {/* Bottom hint text */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-xs text-white/80 backdrop-blur-sm">
            이미지를 드래그하여 이동하세요
          </div>
        </div>
      )}
    </>
  );
}
