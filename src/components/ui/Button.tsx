'use client';

import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// 채운(primary) 버튼은 화면에 하나, 나머지는 글자 버튼. 그림자·그라데이션 없음.
// 전환은 색과 투명도만 (150–200ms ease-out).
const PRIMARY = 'rounded-[12px] bg-primary text-white hover:bg-primary-hover';
const OUTLINE = 'rounded-[12px] border border-line-3 bg-white text-ink hover:bg-fill';
const TEXT = 'rounded-[8px] bg-transparent text-ink hover:text-primary';
const TEXT_DANGER = 'rounded-[8px] bg-transparent text-negative hover:text-negative-hover';
const TEXT_PRIMARY = 'rounded-[8px] bg-transparent text-primary hover:text-primary-hover';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-semibold transition-colors duration-150 ease-out cursor-pointer disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        primary: PRIMARY,
        outline: OUTLINE,
        text: TEXT,
        textDanger: TEXT_DANGER,
        textPrimary: TEXT_PRIMARY,
        // 기존 호출처 호환 alias
        default: PRIMARY,
        destructive: TEXT_DANGER,
        secondary: 'rounded-[10px] bg-fill text-ink hover:bg-line-2',
        ghost: TEXT,
        link: `${TEXT_PRIMARY} hover:underline underline-offset-4`,
      },
      size: {
        sm: 'h-9 px-3 text-[14px]',
        default: 'h-10 px-4 text-[14px]',
        lg: 'h-12 px-[22px] text-[15px]',
        cta: 'h-14 px-6 text-[16px]',
        icon: 'h-10 w-10 text-[14px]',
      },
    },
    compoundVariants: [
      // 글자 버튼은 좌우 여백을 줄인다 (디자인: padding 0 10px, 높이 36–40)
      { variant: ['text', 'textDanger', 'textPrimary', 'ghost', 'destructive', 'link'], size: ['sm', 'default'], className: 'px-2.5' },
    ],
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            로딩중...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
