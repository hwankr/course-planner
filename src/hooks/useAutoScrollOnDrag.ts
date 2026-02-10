'use client';

import { useRef, useCallback, useEffect } from 'react';

/** Duration-controlled smooth scroll using requestAnimationFrame. */
export function smoothScrollTo(targetTop: number, duration: number) {
  const startTop = window.pageYOffset;
  const distance = targetTop - startTop;
  if (distance === 0) return;
  const startTime = performance.now();

  function step(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = progress * (2 - progress); // ease-out quad
    window.scrollTo(0, startTop + distance * eased);
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

/**
 * 모바일 드래그 시작 시 타겟 요소로 자동 스크롤하는 훅.
 * useRef 기반 상태로 드래그 중 불필요한 re-render를 방지.
 * 터치 디바이스에서만 동작 (ontouchstart / maxTouchPoints 감지).
 */
export function useAutoScrollOnDrag(
  targetRef: React.RefObject<HTMLElement | null>,
  catalogRef?: React.RefObject<HTMLElement | null>,
) {
  const isDragScrollActiveRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDragStartScroll = useCallback(
    (source: { droppableId: string }) => {
      // Only on touch devices (ontouchstart + maxTouchPoints is more reliable than matchMedia pointer:coarse)
      if (typeof window === 'undefined') return;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      if (!isTouchDevice) return;

      // Only when dragging from catalog (not semester-to-semester)
      if (source.droppableId !== 'catalog') return;

      isDragScrollActiveRef.current = true;

      // Apply visual fade via DOM directly to avoid re-render during INITIAL_PUBLISH
      catalogRef?.current?.classList.add('drag-scroll-active');

      // Clear previous timeout if rapid drag
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Delay 80ms to let @dnd-kit complete initial setup
      scrollTimeoutRef.current = setTimeout(() => {
        const el = targetRef.current;
        if (el) {
          const rect = el.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          // Short duration (200ms) smooth scroll: provides visual feedback
          // without prolonged conflict with @dnd-kit coordinate tracking.
          smoothScrollTo(scrollTop + rect.top - 8, 200);
        }
        scrollTimeoutRef.current = null;
      }, 80);
    },
    [targetRef, catalogRef]
  );

  const handleDragEndRestore = useCallback(() => {
    isDragScrollActiveRef.current = false;

    // Remove visual fade via DOM
    catalogRef?.current?.classList.remove('drag-scroll-active');

    // Cleanup pending timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
  }, [catalogRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return { handleDragStartScroll, handleDragEndRestore, isDragScrollActiveRef };
}
