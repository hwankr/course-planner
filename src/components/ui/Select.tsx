'use client';

import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  wrapperClassName?: string;
}

/** 폼과 필터에 쓰는 밑줄 선택 입력. 보이는 라벨과 입력을 자동으로 연결한다. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, id, className, wrapperClassName, children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    return (
      <div className={cn('group min-w-0', wrapperClassName)}>
        {label && <label htmlFor={selectId} className="mb-1.5 block text-[13px] leading-[18px] font-semibold text-ink-2 group-focus-within:text-primary">{label}</label>}
        <select
          ref={ref}
          id={selectId}
          className={cn('h-10 w-full max-w-full rounded-none border-0 border-b border-line-3 bg-transparent px-0 pr-6 text-[14px] font-medium text-ink transition-colors focus:border-primary focus:shadow-[inset_0_-1px_0_var(--color-primary)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50', className)}
          {...props}
        >
          {children}
        </select>
      </div>
    );
  }
);
Select.displayName = 'Select';
