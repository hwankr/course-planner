'use client';

import { forwardRef, useId } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  /** 보이는 라벨 (13/600 Ink2, 포커스 시 Primary). 생략하면 호출처가 라벨을 직접 제공한다. */
  label?: string;
  /** 도움말 (12/16 Ink2) */
  helperText?: string;
  /**
   * underline: 폼 입력 — 밑줄 하나, 포커스 시 2px Primary
   * search: 검색 — 채운 회색(Fill), radius 10, 왼쪽 Search 아이콘
   */
  variant?: 'underline' | 'search';
  /** 바깥 래퍼 className */
  wrapperClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { className, wrapperClassName, type, error, label, helperText, variant = 'underline', id, ...props },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const describedById = error || helperText ? `${inputId}-desc` : undefined;
    const isSearch = variant === 'search';

    const input = (
      <input
        id={inputId}
        type={type ?? (isSearch ? 'search' : undefined)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedById}
        className={cn(
          'flex w-full text-ink placeholder:text-placeholder focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-150 ease-out',
          isSearch
            ? 'h-10 rounded-[10px] border-0 bg-fill pl-9 pr-3 text-[14px] font-medium focus:shadow-[inset_0_0_0_2px_var(--color-primary)]'
            : 'h-10 rounded-none border-0 border-b border-line-3 bg-transparent px-0 text-[17px] font-medium focus:border-primary focus:shadow-[inset_0_-1px_0_var(--color-primary)]',
          error &&
            (isSearch
              ? 'shadow-[inset_0_0_0_1px_var(--color-negative)]'
              : 'border-negative focus:border-negative focus:shadow-[inset_0_-1px_0_var(--color-negative)]'),
          className
        )}
        ref={ref}
        {...props}
      />
    );

    return (
      <div className={cn('group w-full', wrapperClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'mb-1.5 block text-[13px] leading-[18px] font-semibold text-ink-2 transition-colors duration-150 group-focus-within:text-primary',
              error && 'text-negative group-focus-within:text-negative'
            )}
          >
            {label}
          </label>
        )}
        {isSearch ? (
          <div className="relative flex items-center">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 h-[18px] w-[18px] text-placeholder"
            />
            {input}
          </div>
        ) : (
          input
        )}
        {(error || helperText) && (
          <p
            id={describedById}
            className={cn('mt-1.5 text-[12px] leading-4', error ? 'text-negative' : 'text-ink-2')}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
