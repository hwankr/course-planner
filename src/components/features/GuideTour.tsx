'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useGuideStore } from '@/stores/guideStore';
import { tourSteps } from '@/lib/tourSteps';

export default function GuideTour() {
  const { currentTourStep, nextStep, prevStep, dismissTour, completeTour } = useGuideStore();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isInitial, setIsInitial] = useState(true);
  const rafRef = useRef<number | null>(null);

  const currentStep = currentTourStep !== null ? tourSteps[currentTourStep] : null;

  // Update target rect WITHOUT scrolling (for scroll/resize events)
  const updateRect = useCallback(() => {
    if (!currentStep) return;
    const el = document.querySelector(`[data-tour="${currentStep.target}"]`);
    if (!el) return;
    setTargetRect(el.getBoundingClientRect());
  }, [currentStep]);

  // Throttled rect update using rAF
  const throttledUpdateRect = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      updateRect();
      rafRef.current = null;
    });
  }, [updateRect]);

  // On step change: scroll into view, then calculate position
  useEffect(() => {
    if (currentStep === null) {
      setIsReady(false);
      setIsInitial(true);
      return;
    }

    const delay = isInitial ? 400 : 100;
    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-tour="${currentStep.target}"]`);
      if (!el) {
        console.warn(`Tour target not found: ${currentStep.target}`);
        return;
      }

      // On mobile, scroll to 'start' so bottom sheet doesn't cover the target
      const isMobile = window.innerWidth < 640;
      el.scrollIntoView({
        behavior: isInitial ? 'smooth' : 'auto',
        block: isMobile ? 'start' : 'center',
      });

      // Wait for scroll to settle, then capture rect
      const settleTimer = setTimeout(() => {
        setTargetRect(el.getBoundingClientRect());
        setIsReady(true);
        setIsInitial(false);
      }, isInitial ? 300 : 50);

      return () => clearTimeout(settleTimer);
    }, delay);

    return () => clearTimeout(timer);
  }, [currentStep, isInitial]);

  // Listen for scroll/resize to update rect position (no scrollIntoView here)
  useEffect(() => {
    if (!isReady) return;

    window.addEventListener('resize', throttledUpdateRect);
    window.addEventListener('scroll', throttledUpdateRect, true);

    return () => {
      window.removeEventListener('resize', throttledUpdateRect);
      window.removeEventListener('scroll', throttledUpdateRect, true);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isReady, throttledUpdateRect]);

  // ESC key dismisses tour
  useEffect(() => {
    if (!isReady) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismissTour();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReady, dismissTour]);

  if (currentTourStep === null || !currentStep || !isReady || !targetRect) {
    return null;
  }

  const isFirstStep = currentTourStep === 0;
  const isLastStep = currentTourStep === tourSteps.length - 1;
  const progress = `${currentTourStep + 1} / ${tourSteps.length}`;

  // Mobile: determine if target is in the lower half of viewport
  // If so, show explanation at top instead of bottom to avoid covering the target
  const mobileSheetHeight = 180;
  const mobileShowTop = targetRect.bottom > window.innerHeight - mobileSheetHeight;

  // Calculate popover position for desktop
  const popoverWidth = 320;
  const popoverHeight = 180;
  const offset = 12;
  const pad = 16;

  let popTop = 0;
  let popLeft = 0;

  switch (currentStep.position) {
    case 'bottom':
      popTop = targetRect.bottom + offset;
      popLeft = targetRect.left + targetRect.width / 2 - popoverWidth / 2;
      break;
    case 'top':
      popTop = targetRect.top - popoverHeight - offset;
      popLeft = targetRect.left + targetRect.width / 2 - popoverWidth / 2;
      break;
    case 'left':
      popTop = targetRect.top + targetRect.height / 2 - popoverHeight / 2;
      popLeft = targetRect.left - popoverWidth - offset;
      break;
    case 'right':
      popTop = targetRect.top + targetRect.height / 2 - popoverHeight / 2;
      popLeft = targetRect.right + offset;
      break;
  }

  popTop = Math.max(pad, Math.min(popTop, window.innerHeight - popoverHeight - pad));
  popLeft = Math.max(pad, Math.min(popLeft, window.innerWidth - popoverWidth - pad));

  return (
    <>
      {/* Overlay with spotlight cutout */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        <div
          className="absolute rounded-lg transition-all duration-200 ease-out"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
          }}
        />
      </div>

      {/* Desktop popover */}
      <div
        className="hidden sm:block fixed bg-white rounded-xl shadow-2xl p-4 max-w-xs z-[60] transition-all duration-200 ease-out"
        style={{ top: popTop, left: popLeft }}
      >
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg text-gray-900">{currentStep.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{currentStep.description}</p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="text-xs text-gray-500 font-medium">{progress}</span>
            <div className="flex gap-2">
              <button
                onClick={dismissTour}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                건너뛰기
              </button>
              {!isFirstStep && (
                <button
                  onClick={prevStep}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  이전
                </button>
              )}
              <button
                onClick={isLastStep ? completeTour : nextStep}
                className="px-3 py-1.5 text-sm bg-[#153974] hover:bg-[#0f2a56] text-white rounded-lg transition-colors"
              >
                {isLastStep ? '완료' : '다음'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sheet - top or bottom depending on target position */}
      <div className={`sm:hidden fixed left-0 right-0 bg-white shadow-2xl p-5 z-[60] ${
        mobileShowTop
          ? 'top-0 rounded-b-2xl animate-slide-down'
          : 'bottom-0 rounded-t-2xl animate-slide-up'
      }`}>
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-base text-gray-900">{currentStep.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{currentStep.description}</p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="text-xs text-gray-500 font-medium">{progress}</span>
            <div className="flex gap-2">
              <button
                onClick={dismissTour}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                건너뛰기
              </button>
              {!isFirstStep && (
                <button
                  onClick={prevStep}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  이전
                </button>
              )}
              <button
                onClick={isLastStep ? completeTour : nextStep}
                className="px-3 py-1.5 text-sm bg-[#153974] hover:bg-[#0f2a56] text-white rounded-lg transition-colors"
              >
                {isLastStep ? '완료' : '다음'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
