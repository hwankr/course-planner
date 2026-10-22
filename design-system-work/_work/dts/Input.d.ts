// Input — props adapted from src/components/ui/Input.tsx. Documentation only; not type-checked.
import type {
  ForwardRefExoticComponent,
  InputHTMLAttributes,
  RefAttributes,
} from 'react';

/**
 * Source: `extends React.InputHTMLAttributes<HTMLInputElement>` plus `error` — the only own member.
 * Every native input attribute passes through to the <input>; the ones the app relies on:
 * - `type?: HTMLInputTypeAttribute` — pulled out and re-applied to the <input> (text, email, password, number). Default undefined, which the browser treats as text.
 * - `className?: string` — extra Tailwind classes merged last through cn() (clsx + tailwind-merge) onto the <input>, not the wrapper. The app passes border-red-500 and flex-1.
 * - `placeholder?: string` — shown in gray-400. The app passes email@example.com, ••••••••, 홍길동, 예: 데이터베이스, 과목명 또는 코드 검색..., 예: 130.
 * - `disabled?: boolean` — cursor-not-allowed and opacity-50 on the field. Default false. Unused by the app.
 * - `required?: boolean` — forwarded; the component adds no asterisk or aria-required of its own. Default false.
 * - `id?: string` — forwarded so a consumer <label htmlFor> can point at the field. The component generates none.
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Validation message. A non-empty string turns the field border and focus ring red-500 and renders the text in a <p> under the field. Default undefined. The app never passes it; forms pass className="border-red-500" and print their own message. */
  error?: string;
}

/** forwardRef<HTMLInputElement, InputProps>; the ref reaches the <input>, not the wrapper <div>. displayName 'Input'. No children (void element). */
export declare const Input: ForwardRefExoticComponent<InputProps & RefAttributes<HTMLInputElement>>;
