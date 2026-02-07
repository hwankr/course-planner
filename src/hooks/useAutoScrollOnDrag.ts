'use client';

import { useRef, useCallback, useEffect } from 'react';

/**
 * 모바일 드래그 시작 시 타겟 요소로 자동 스크롤하는 훅.
 * useRef 기반 상태로 드래그 중 불필요한 re-render를 방지.
 * 터치 디바이스에서만 동작 (ontouchstart / maxTouchPoints 감지).
 */
export function useAutoScrollOnDrag(targetRef: React.RefObject<HTMLElement | null>) {
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

      // Clear previous timeout if rapid drag
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Delay 150ms to let @hello-pangea/dnd complete INITIAL_PUBLISH
      scrollTimeoutRef.current = setTimeout(() => {
        const el = targetRef.current;
        if (el) {
          const rect = el.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          window.scrollTo({
            top: scrollTop + rect.top - 8,
            behavior: 'smooth',
          });
        }
        scrollTimeoutRef.current = null;
      }, 150);
    },
    [targetRef]
  );

  const handleDragEndRestore = useCallback(() => {
    isDragScrollActiveRef.current = false;

    // Cleanup pending timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
  }, []);

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
