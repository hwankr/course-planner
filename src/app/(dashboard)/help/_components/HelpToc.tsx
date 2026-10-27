'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HelpTocItem {
  id: string;
  label: string;
}

/**
 * 도움말 목차: 높이 36 글자 링크, 현재 보이는 섹션은 Ink 600.
 * lg 미만에서는 "목차" 글자 버튼으로 접고 펼친다.
 */
export function HelpToc({ items }: { items: HelpTocItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el != null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '0px 0px -60% 0px' }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  return (
    <>
      <nav aria-label="목차" className="flex flex-col border-b border-line lg:hidden">
        <button
          type="button"
          aria-expanded={isMobileOpen}
          aria-controls="help-toc-mobile"
          onClick={() => setIsMobileOpen((open) => !open)}
          className="inline-flex h-11 cursor-pointer items-center gap-1 self-start bg-transparent p-0 text-[14px] font-semibold text-ink-2 transition-colors duration-150 ease-out hover:text-ink"
        >
          목차
          <ChevronDown
            aria-hidden="true"
            className={cn('h-3.5 w-3.5 transition-transform duration-150 ease-out', isMobileOpen && 'rotate-180')}
            strokeWidth={2.5}
          />
        </button>
        {isMobileOpen && (
          <ul id="help-toc-mobile" className="m-0 list-none p-0 pb-2">
            {items.map((item) => (
              <li key={item.id} className="border-t border-line">
                <a
                  href={`#${item.id}`}
                  aria-current={item.id === activeId ? 'location' : undefined}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    'flex min-h-11 items-center text-[15px] transition-colors duration-150 ease-out',
                    item.id === activeId ? 'font-semibold text-ink' : 'font-medium text-ink-2 hover:text-ink'
                  )}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </nav>
      <nav
        aria-label="목차"
        className="hidden lg:sticky lg:top-9 lg:flex lg:w-[220px] lg:shrink-0 lg:flex-col lg:gap-0.5 lg:pt-7 lg:pr-8"
      >
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={active ? 'location' : undefined}
              className={cn(
                'flex h-9 items-center text-[14px] transition-colors duration-150 ease-out',
                active ? 'font-semibold text-ink' : 'font-medium text-ink-2 hover:text-ink'
              )}
            >
              {item.label}
            </a>
          );
        })}
      </nav>
    </>
  );
}
