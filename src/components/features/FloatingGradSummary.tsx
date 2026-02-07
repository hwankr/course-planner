'use client';

import { useState, useEffect } from 'react';
import {
  useGraduationRequirement,
  useGraduationProgress,
} from '@/hooks/useGraduationRequirements';
import { useGraduationPreview } from '@/hooks/useGraduationPreview';

interface FloatingGradSummaryProps {
  requirementsSummaryRef: React.RefObject<HTMLDivElement | null>;
}

export function FloatingGradSummary({ requirementsSummaryRef }: FloatingGradSummaryProps) {
  const [isVisible, setIsVisible] = useState(false);

  const { data: requirement } = useGraduationRequirement();
  const { data: progress } = useGraduationProgress();
  const { delta } = useGraduationPreview();

  // IntersectionObserver to detect when RequirementsSummary scrolls out of view
  useEffect(() => {
    const target = requirementsSummaryRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: '-64px 0px 0px 0px' } // Account for header height
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [requirementsSummaryRef]);

  // Don't render if no requirement set or if RequirementsSummary is visible
  if (!requirement || !isVisible) return null;

  const total = progress?.total ?? { required: requirement.totalCredits, earned: 0, planned: 0, percentage: 0 };
  const major = progress?.major ?? { required: requirement.majorCredits, earned: 0, planned: 0, percentage: 0 };
  const general = progress?.general ?? { required: requirement.generalCredits, earned: 0, planned: 0, percentage: 0 };

  const handleClick = () => {
    requirementsSummaryRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Delta badge render helper
  const renderDeltaBadge = (value: number) => {
    if (value === 0) return null;
    const isPositive = value > 0;
    return (
      <span
        className={`text-[10px] font-semibold px-1 py-0.5 rounded ${
          isPositive ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
        }`}
      >
        {isPositive ? '+' : ''}{value}
      </span>
    );
  };

  return (
    <div
      onClick={handleClick}
      className="fixed top-16 inset-x-0 z-40 animate-fade-in-down cursor-pointer"
    >
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-3 py-2">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Overall percentage */}
            <span className={`text-xs font-bold whitespace-nowrap ${
              total.percentage >= 100 ? 'text-green-600' : 'text-gray-700'
            }`}>
              졸업 {total.percentage}%
              {total.planned > 0 && (
                <span className="text-gray-400 font-normal">
                  →{Math.min(Math.round(((total.earned + total.planned) / total.required) * 100), 100)}%
                </span>
              )}
            </span>

            {delta?.total && renderDeltaBadge(delta.total.planned)}

            {/* Progress bar */}
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden relative max-w-[160px]">
              {total.planned > 0 && (
                <div
                  className={`h-full absolute inset-y-0 left-0 rounded-full ${
                    total.percentage >= 100 ? 'bg-green-200' : 'bg-blue-200'
                  }`}
                  style={{ width: `${Math.min(Math.round(((total.earned + total.planned) / total.required) * 100), 100)}%` }}
                />
              )}
              <div
                className={`h-full relative rounded-full ${
                  total.percentage >= 100 ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(total.percentage, 100)}%` }}
              />
            </div>

            {/* Category breakdown */}
            <div className="hidden sm:flex items-center gap-2 text-[10px] text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                전공 {major.percentage}%
                {delta?.major && renderDeltaBadge(delta.major.planned)}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                교양 {general.percentage}%
                {delta?.general && renderDeltaBadge(delta.general.planned)}
              </span>
            </div>

            {/* Mobile: compact category */}
            <div className="flex sm:hidden items-center gap-1.5 text-[10px] text-gray-500">
              <span>전공 {major.percentage}%</span>
              <span>·</span>
              <span>교양 {general.percentage}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
