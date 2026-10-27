'use client';

import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  wrapperClassName?: string;
}

/** Input과 같은 라벨·밑줄을 쓰는 여러 줄 입력. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, id, className, wrapperClassName, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    return (
      <div className={cn('group w-full min-w-0', wrapperClassName)}>
        {label && <label htmlFor={textareaId} className="mb-1.5 block text-[13px] leading-[18px] font-semibold text-ink-2 group-focus-within:text-primary">{label}</label>}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn('block w-full resize-y rounded-none border-0 border-b border-line-3 bg-transparent px-0 py-2 text-[15px] leading-6 font-medium text-ink placeholder:text-placeholder transition-colors focus:border-primary focus:shadow-[inset_0_-1px_0_var(--color-primary)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50', className)}
          {...props}
        />
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
