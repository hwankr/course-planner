import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ListRowProps extends React.HTMLAttributes<HTMLElement> {
  /** 렌더링할 요소 (리스트 안에서는 'li') */
  as?: 'div' | 'li';
  /** single: 한 줄 46px · double: 두 줄 min 52px · tall: 두 줄 min 56px(모바일) */
  size?: 'single' | 'double' | 'tall';
  /** 아래 1px Line 구분선 (기본 true) */
  divider?: boolean;
}

/** 카드 대신 쓰는 리스트 행: 가로 정렬, gap 16, 아래 1px Line */
const ListRow = React.forwardRef<HTMLElement, ListRowProps>(
  ({ as = 'div', size = 'single', divider = true, className, ...props }, ref) => {
    const Comp = as as React.ElementType;
    return (
      <Comp
        ref={ref}
        className={cn(
          'flex items-center gap-4',
          size === 'single' && 'h-[46px]',
          size === 'double' && 'min-h-[52px] py-1.5',
          size === 'tall' && 'min-h-[56px] py-1.5',
          divider && 'border-b border-line',
          className
        )}
        {...props}
      />
    );
  }
);
ListRow.displayName = 'ListRow';

export { ListRow };
