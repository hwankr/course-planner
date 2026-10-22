// Button — props adapted from src/components/ui/Button.tsx. Documentation only; not type-checked.
import type {
  ButtonHTMLAttributes,
  ForwardRefExoticComponent,
  ReactNode,
  RefAttributes,
} from 'react';

/** cva `variant` keys. The app uses default, outline and ghost; destructive, secondary and link are defined but unused. */
export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';

/** cva `size` keys. The app uses default, sm and lg; icon is defined but unused. */
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

/** Source: `extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants>` plus `isLoading`. */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style (cva variant). Default 'default', the yu-navy → yu-blue gradient; null falls back to it. */
  variant?: ButtonVariant | null;
  /** Dimensions (cva size). Default 'default': 40px tall, 8px 16px padding; null falls back to it. */
  size?: ButtonSize | null;
  /** When true the <button> is disabled and renders the spinning SVG plus the text 로딩중... instead of children. Default false. */
  isLoading?: boolean;
  /** Native disabled, forwarded; the rendered <button> gets `disabled || isLoading`. */
  disabled?: boolean;
  /** Extra Tailwind classes merged last through cn() (clsx + tailwind-merge), so they win over the variant classes (w-full, flex-1, shadow-glow). */
  className?: string;
  /** Label content, usually a Korean string, optionally followed by a lucide icon; replaced while isLoading. */
  children?: ReactNode;
}

/** The cva function behind the classes; `buttonVariants({ variant, size, className })` returns the merged class string. */
export declare function buttonVariants(props?: {
  variant?: ButtonVariant | null;
  size?: ButtonSize | null;
  className?: string;
}): string;

/** forwardRef<HTMLButtonElement, ButtonProps>; the ref reaches the <button>. displayName 'Button'. */
export declare const Button: ForwardRefExoticComponent<ButtonProps & RefAttributes<HTMLButtonElement>>;
