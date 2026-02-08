'use client';

import { useState, useRef, useEffect } from 'react';
import { useGuideStore } from '@/stores/guideStore';

interface ContextualTipProps {
  tipId: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
}

export default function ContextualTip({
  tipId,
  content,
  position = 'top',
  children,
}: ContextualTipProps) {
  const { seenTips, currentTourStep, markTipSeen } = useGuideStore();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Don't show tip if already seen or tour is active
  const shouldShowIndicator = !seenTips[tipId] && currentTourStep === null;

  // Close popover on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleDotClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    markTipSeen(tipId);
    setIsOpen(false);
  };

  // Position classes for popover
  const getPopoverPositionClass = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  return (
    <div className="relative inline-flex">
      {children}

      {shouldShowIndicator && (
        <>
          {/* Pulsing blue dot indicator */}
          <button
            type="button"
            onClick={handleDotClick}
            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#00AACA] animate-pulse cursor-pointer z-10"
            aria-label="도움말 보기"
          />

          {/* Popover */}
          {isOpen && (
            <div
              ref={popoverRef}
              className={`absolute z-40 bg-white shadow-lg rounded-lg p-3 max-w-[200px] ${getPopoverPositionClass()}`}
            >
              <p className="text-sm text-gray-700 mb-2">{content}</p>
              <button
                type="button"
                onClick={handleConfirm}
                className="w-full px-3 py-1.5 bg-[#00AACA] text-white text-sm rounded hover:bg-[#008FA9] transition-colors"
              >
                확인
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
