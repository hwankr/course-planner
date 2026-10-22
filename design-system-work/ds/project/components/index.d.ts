// Course Planner — components/index.d.ts
// Props of the app's React components (src/components), copied from their TypeScript sources.
// Documentation only: the design system ships static renditions, not the React code.

// ----- Button -----
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

// ----- Card -----
// Source: src/components/ui/Card.tsx — documentation only, not type-checked.
// Six forwardRef parts; none declares its own interface, each spreads React.HTMLAttributes onto one element.
// `ref` is not in any source props type; forwardRef adds it externally, identically, to all six parts (typed below as the source's forwardRef<Element, …> says).
import type * as React from "react";

/** Root <div>: "rounded-lg border bg-white text-gray-900 shadow-sm hover:shadow-md transition-shadow duration-300". */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Merged into the base classes with cn() (tailwind-merge), so it can override them; app passes e.g. "border-red-200", "border-dashed", "p-8 text-center", "max-w-md", "h-full", "animate-fade-in-up". Default: none. */
  className?: string;
  /** Usually CardHeader, then CardContent, then CardFooter; any node is accepted. */
  children?: React.ReactNode;
  /** Ref is forwarded to the root <div> (React.forwardRef<HTMLDivElement, …>). */
  ref?: React.Ref<HTMLDivElement>;
}

/** <div> "flex flex-col space-y-1.5 p-6": stacks CardTitle over CardDescription with 6px between. */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Merged with cn(); app passes "flex flex-row items-center justify-between" to put a Button beside the title. */
  className?: string;
  /** CardTitle, CardDescription, or an icon row wrapping the title. */
  children?: React.ReactNode;
  /** Ref is forwarded to the <div> (React.forwardRef<HTMLDivElement, …>). */
  ref?: React.Ref<HTMLDivElement>;
}

/** <h3> "text-2xl font-semibold leading-none tracking-tight"; typed as HTMLAttributes<HTMLHeadingElement>, ref typed HTMLParagraphElement in source. */
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Merged with cn(); app passes "text-lg" (admin menu tiles) or "text-red-600" (계정 초기화 / 위험 구역). */
  className?: string;
  /** The title text, e.g. 기본 정보. */
  children?: React.ReactNode;
  /** Ref is forwarded to the <h3>, but the source types it HTMLParagraphElement (forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>) — quirk preserved. */
  ref?: React.Ref<HTMLParagraphElement>;
}

/** <p> "text-sm text-gray-500". */
export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** Merged with cn(); unused by the app. */
  className?: string;
  /** One sentence under the title, e.g. 과목을 추가, 수정, 삭제합니다. */
  children?: React.ReactNode;
  /** Ref is forwarded to the <p> (React.forwardRef<HTMLParagraphElement, …>). */
  ref?: React.Ref<HTMLParagraphElement>;
}

/** <div> "p-6 pt-0": the body slot, flush under the header. */
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Merged with cn(); app passes "pt-6" when there is no CardHeader (stat tiles). */
  className?: string;
  /** Forms, rows, stats — anything. */
  children?: React.ReactNode;
  /** Ref is forwarded to the <div> (React.forwardRef<HTMLDivElement, …>). */
  ref?: React.Ref<HTMLDivElement>;
}

/** <div> "flex items-center p-6 pt-0": a horizontal action row; exported but not used anywhere in the app. */
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Merged with cn(). */
  className?: string;
  /** Buttons or meta text laid out in a row. */
  children?: React.ReactNode;
  /** Ref is forwarded to the <div> (React.forwardRef<HTMLDivElement, …>). */
  ref?: React.Ref<HTMLDivElement>;
}

// ----- Input -----
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

// ----- Toast -----
// Toast — props adapted from src/stores/toastStore.ts (the Toast record) and src/components/ui/Toast.tsx (the renderer). Documentation only; not type-checked.

/** Which left rail and action color a toast takes (typeStyles in Toast.tsx). */
export type ToastType = 'success' | 'info' | 'warning';

/** Rendered instead of `description`: two mini progress rows showing graduation progress before and after a course was added. */
export interface ToastGraduationDelta {
  /** Credits the added course contributes; carried on the record, not rendered by Toast.tsx. */
  creditsDelta: number;
  /** Korean category label of the course (전공핵심, 교양선택, 자유선택 …); the first row shows 전공 when it starts with 전공, else 교양. */
  categoryLabel: string;
  /** First-row percentages; the row renders only when this is set (yu-blue before over yu-blue-a40 after). */
  categoryPct?: { before: number; after: number };
  /** First-row counter shown as `after/required`; when absent the row shows `before→after%`. */
  categoryCredits?: { after: number; required: number };
  /** Second-row label: 전공핵심 for major courses, 전체 otherwise. */
  secondRowLabel: string;
  /** Second-row percentages (green-500 before over green-300 after). */
  secondRowPct: { before: number; after: number };
  /** Second-row counter shown as `after/required`. */
  secondRowCredits: { after: number; required: number };
}

/** One toast record as the store keeps it. Consumers pass `Omit<Toast, 'id'>` to `addToast`. */
export interface Toast {
  /** crypto.randomUUID(), assigned by addToast. */
  id: string;
  /** Headline, 14px medium gray-900, truncated to one line. */
  message: string;
  /** Optional 12px gray-500 second line; ignored when graduationDelta is set. No call site in the app passes it. */
  description?: string;
  /** Optional progress rows rendered under the message instead of description. */
  graduationDelta?: ToastGraduationDelta;
  /** Rail and action color. */
  type: ToastType;
  /** Optional text button before the close X; clicking runs onClick, then removes the toast. */
  action?: { label: string; onClick: () => void };
  /** Auto-dismiss delay in ms. Default 5000 in addToast. */
  duration?: number;
}

/** The zustand store the Toast component reads. */
export interface ToastState {
  /** Newest last; capped at 3 (the oldest is dropped). */
  toasts: Toast[];
  /** Adds a toast, schedules its removal after `duration`, returns its id. */
  addToast: (toast: Omit<Toast, 'id'>) => string;
  /** Removes one toast by id. */
  removeToast: (id: string) => void;
}

/** The component takes no props: it renders every toast in the store, or null when there are none. */
export interface ToastProps {}

/** Hook returning the store (zustand `create<ToastState>`). */
export declare function useToastStore(): ToastState;
export declare namespace useToastStore {
  function getState(): ToastState;
}

/** Client component; mount once near the root. */
export declare function Toast(props?: ToastProps): JSX.Element | null;

// ----- SearchableSelect -----
// SearchableSelect — props copied from src/components/ui/SearchableSelect.tsx. Documentation only; not type-checked.
import type { ReactElement } from 'react';

/** One entry of `options`. Exported by the source as `SearchableSelectOption`. */
export interface SearchableSelectOption {
  /** Identity compared with `value` by === to mark the selected row, and handed to onChange on click. The app passes the department _id. */
  value: string;
  /** Text of the row and of the closed input; the filter is label.toLowerCase().includes(term.toLowerCase()). The app passes the department name. */
  label: string;
  /** Optional group heading. Grouped options render after all ungrouped ones, under a 12px uppercase gray-500 header on gray-50, groups in first-seen order. The onboarding page passes dept.college || '' ('' counts as ungrouped); the profile page passes none. */
  group?: string;
}

export interface SearchableSelectProps {
  /** The full list to search. Filtering happens on every keystroke in the component; nothing is fetched. */
  options: SearchableSelectOption[];
  /** The selected option's value, or '' for none. Fully controlled; the component keeps no copy. */
  value: string;
  /** Called with the clicked option's value, or with '' when the clear X is pressed. */
  onChange: (value: string) => void;
  /** Placeholder of the text input, visible when nothing is selected and whenever the list is open with an empty search term. Default '선택하세요'. The app passes '학과를 검색하세요' and, while departments load, '불러오는 중...'. */
  placeholder?: string;
  /** Native disabled on the input (cursor-not-allowed, opacity-50); also hides the clear X and keeps the list closed. Default false. The onboarding page passes isDeptLoading. */
  disabled?: boolean;
  /** Extra classes appended to the root <div className="relative">, not to the input. Default ''. Unused by the app. */
  className?: string;
}

/** Plain function component ('use client'); no forwardRef, no children, no id/name/aria passthrough. Renders <div.relative> > <div.relative> > <input type="text"> (+ clear <button> when value is set) and, while open, the dropdown <div>. */
export declare function SearchableSelect(props: SearchableSelectProps): ReactElement;

// ----- Footer -----
// Footer — props adapted from src/components/ui/Footer.tsx and src/components/ui/CopyEmail.tsx. Documentation only; not type-checked.

import type * as React from 'react';

/** Footer takes no props: every column, link, route and the contact address is hardcoded in the component. */
export interface FooterProps {}

/** Props of the click-to-copy contact line rendered inside the brand column (a part of Footer). */
export interface CopyEmailProps {
  /** Address written to the clipboard on click and shown as `Contact : {email}`; the footer passes 'fabronjeon@gmail.com'. */
  email: string;
}

/** Server component; RootLayout renders it once after the page wrapper, and `mt-auto` pins it to the bottom of short pages. */
export declare function Footer(): React.JSX.Element;

/** Client component ('use client'); keeps a local `copied` boolean for 2000 ms after a click and shows 복사됨! while it is true. */
export declare function CopyEmail(props: CopyEmailProps): React.JSX.Element;

// ----- ZoomableImage -----
// ZoomableImage — props copied from src/components/ui/ZoomableImage.tsx (the interface is not exported there). Documentation only; not type-checked.

export interface ZoomableImageProps {
  /** Image URL handed to next/image for both the thumbnail and the lightbox; the help page passes /help/*.png. */
  src: string;
  /** Alt text, rendered identically on the thumbnail and the full-size image. */
  alt: string;
  /** Intrinsic width in px for next/image (the width attribute of both <img>s); the help page passes 1080–1500. */
  width: number;
  /** Intrinsic height in px for next/image (the height attribute of both <img>s); the help page passes 200–800. */
  height: number;
  /** Class names for the thumbnail <img> only, not the lightbox image; every call site passes "w-full h-auto". Default "". */
  className?: string;
}

/** Client component (default export). Renders the thumbnail with its hint overlays and, while open, a fixed full-screen lightbox as a following sibling; locks body scroll while open. */
declare function ZoomableImage(props: ZoomableImageProps): JSX.Element;
export default ZoomableImage;

// ----- ErrorBoundary -----
// ErrorBoundary — props and state copied from src/components/ErrorBoundary.tsx. The source exports only the class;
// the two interfaces are module-private there and exported here for documentation. Not type-checked.
import type * as React from 'react';

/** Props of the class component. */
export interface ErrorBoundaryProps {
  /** The subtree to guard; returned unchanged until a descendant throws during render. */
  children: React.ReactNode;
  /** Optional replacement for the built-in fallback card; returned as-is when set. No call site in the app passes it. */
  fallback?: React.ReactNode;
}

/** Internal state. */
export interface ErrorBoundaryState {
  /** True once getDerivedStateFromError has caught an error; switches the render to `fallback` or the built-in card. */
  hasError: boolean;
  /** The caught Error, whose message and stack fill the dev-only <details>; null before any error. */
  error: Error | null;
}

/** Client class component ('use client'); mount once around a page region. */
export declare class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  /** Returns { hasError: true, error } from the thrown value. */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState;
  /** Reports to Sentry with the component stack as `extra.componentStack`. */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void;
  /** Retry handler wired to 다시 시도: window.location.reload(). */
  handleReset: () => void;
  render(): React.ReactNode;
}

// ----- CourseCard -----
// CourseCard props — adapted from src/components/features/CourseCard.tsx (documentation only, not type-checked).

import type { Types } from 'mongoose';

/** Course status enum shared by the card surface, the default-mode label and the compact pill. */
export type CourseStatus = 'planned' | 'enrolled' | 'completed' | 'failed';

/** Requirement category; drives the category chip label and colors. */
export type CourseCategory =
  | 'major_required'
  | 'major_compulsory'
  | 'major_elective'
  | 'general_required'
  | 'general_elective'
  | 'free_elective'
  | 'teaching';

/** The course object the card renders (inline type in the source). */
export interface CourseCardCourse {
  /** Mongo id from the API (catalog items). */
  _id?: Types.ObjectId | string;
  /** Plan-side id (courses inside a semester). */
  id?: string;
  /** Course code — accepted but never rendered by CourseCard. */
  code: string;
  /** Course name; truncated to one line. */
  name: string;
  /** Credit count rendered as `{credits}학점`. */
  credits: number;
  /** Category chip; chip is hidden when missing or unknown. */
  category?: CourseCategory;
  /** Status; undefined falls back to 'planned' for the surface and hides the default-mode status pill. */
  status?: CourseStatus;
}

export interface CourseCardProps {
  /** The course to render. */
  course: CourseCardCourse;
  /** Position in the semester list; accepted for SemesterColumn, unused in render. */
  index?: number;
  /** Shows the remove X when set (and isDragDisabled is false); called on click with propagation stopped. */
  onRemove?: () => void;
  /** Enables the status toggle (default: outlined pill; compact: filled pill). Toggles completed <-> planned; other statuses go to completed. */
  onStatusChange?: (courseId: string, newStatus: CourseStatus) => void;
  /** Catalog item already in the plan: opacity-60, cursor-not-allowed, remove X hidden. No declared default (undefined is falsy). */
  isDragDisabled?: boolean;
  /** Single-line condensed layout with the 9px filled status pill. Default false. */
  compact?: boolean;
  /** Department chip text; '복수전공' is purple, '부전공' is orange, anything else gray. */
  departmentLabel?: string;
}

/** Base surface the card wraps (src/components/ui/Card.tsx): a plain div; className is merged with twMerge. */
export type CardProps = React.HTMLAttributes<HTMLDivElement>;

// ----- SemesterColumn -----
// SemesterColumn — props adapted from src/components/features/SemesterColumn.tsx (documentation only, not type-checked).

/** Semester term; renders as 1학기 (spring) or 2학기 (fall). */
export type SemesterTerm = 'spring' | 'fall';

/** Course status; drives the row surface tint and the compact status pill. */
export type CourseStatus = 'planned' | 'enrolled' | 'completed' | 'failed';

/** Requirement category; drives the category chip and the header breakdown (전핵 · 전필 · 전선 · 교필 · 교선 · 교직 · 자선). */
export type CourseCategory =
  | 'major_required'
  | 'major_compulsory'
  | 'major_elective'
  | 'general_required'
  | 'general_elective'
  | 'free_elective'
  | 'teaching';

/** One course inside a semester (the plan's shape, not the catalog's). */
export interface SemesterCourse {
  /** Plan-side id; also the dnd-kit draggable id. */
  id: string;
  /** Course code (not rendered by the column itself). */
  code: string;
  /** Course name, truncated in the row. */
  name: string;
  /** Credit count, summed into the header total and breakdown. */
  credits: number;
  /** Category; missing counts as free_elective in the breakdown. */
  category?: CourseCategory;
  /** Required here (optional on CourseCard). */
  status: CourseStatus;
}

export interface SemesterColumnProps {
  /** The semester to render; droppable id is `semester-${year}-${term}`. */
  semester: {
    /** Academic year, rendered as `{year}학년`. */
    year: number;
    /** Term, rendered as 1학기 / 2학기. */
    term: SemesterTerm;
    /** Courses in this semester, in display order. */
    courses: SemesterCourse[];
  };
  /** Called with the course id when a row's 과목 제거 button is clicked. */
  onRemoveCourse: (courseId: string) => void;
  /** When given, shows the 학기 삭제 icon button (confirms first if the semester has courses). */
  onDelete?: () => void;
  /** When given and the semester has courses, shows the 학기 초기화 icon button (always confirms). */
  onClear?: () => void;
  /** Cyan ring + border, navy-tinted header, Focus badge and the focused empty-state copy. Default false. */
  isFocused?: boolean;
  /** Fired when the header is clicked. */
  onFocus?: () => void;
  /** Dense mode: p-2, text-sm title, min-height 180px, 4 visible rows with +N개 더 보기 / 접기. Default false. */
  compact?: boolean;
  /** Passed through to each row's status pill (planned <-> completed toggle). */
  onStatusChange?: (courseId: string, newStatus: CourseStatus) => void;
}

/** Internal (not exported by the source, nor from this file): the dnd-kit draggable wrapper around each compact CourseCard. Documentation only. */
interface DraggableSemesterCourseProps {
  /** The course to render. */
  course: SemesterCourse;
  /** Position in the visible list. */
  index: number;
  /** Mirrors the column's compact flag. */
  compact: boolean;
  /** The parent droppable id, stored in the drag data. */
  containerId: string;
  /** Row-level remove handler (already bound to the course id). */
  onRemove: () => void;
  /** Status toggle handler passed through from the column. */
  onStatusChange?: (courseId: string, newStatus: CourseStatus) => void;
}

// ----- ReadOnlySemesterColumn -----
// ReadOnlySemesterColumn props — adapted from src/components/features/ReadOnlySemesterColumn.tsx (documentation only, not type-checked).

/** Category keys the component knows; they drive the short chip label and its colors. A missing/empty value counts as 'free_elective' (자선) in both the chip and the header breakdown; any other non-empty string gets the 자선 chip but is omitted from the breakdown (its credits still count in the total). */
export type ReadOnlyCategoryKey =
  | 'major_required'    // 전핵 — red-100 / red-700
  | 'major_compulsory'  // 전필 — rose-100 / rose-700
  | 'major_elective'    // 전선 — orange-100 / orange-700
  | 'general_required'  // 교필 — blue-100 / blue-700
  | 'general_elective'  // 교선 — green-100 / green-700
  | 'teaching'          // 교직 — violet-100 / violet-700
  | 'free_elective';    // 자선 — gray-100 / gray-600

/** One course row (inline type in the source). */
export interface ReadOnlySemesterCourse {
  /** Course code, rendered as the gray-400 caption under the name. */
  code: string;
  /** Course name; truncated to one line. */
  name: string;
  /** Credit count rendered as `{credits}학점` and summed into the header total and breakdown. */
  credits: number;
  /** Category; typed as a plain string in the source. A missing/empty value counts as 'free_elective' (자선) in the chip and the breakdown; an unknown non-empty value gets the 자선 chip but is omitted from the header breakdown (its credits still count in `{totalCredits}학점`). */
  category?: string;
}

/** The semester the column renders (inline type in the source). */
export interface ReadOnlySemester {
  /** Academic year, rendered as `{year}학년`. */
  year: number;
  /** 'spring' renders 1학기; any other string renders 2학기. */
  term: string;
  /** Rows in display order; also the source of the credit total and course count. */
  courses: ReadOnlySemesterCourse[];
}

export interface ReadOnlySemesterColumnProps {
  /** The semester to render. */
  semester: ReadOnlySemester;
  /** Tighter padding and type (p-2, text-sm / text-xs) plus a collapsible list that starts collapsed with a 펼치기 button. Default false; the app never passes it. */
  compact?: boolean;
}

// ----- RequirementsSummary -----
// RequirementsSummary — props documentation (not type-checked).
// Source: src/components/features/RequirementsSummary.tsx, src/lib/graduationSummaryState.ts

/** The widget takes no props: it reads TanStack Query hooks (useGraduationRequirement, useGraduationProgress), next-auth session and the guest/plan Zustand stores itself. */
export interface RequirementsSummaryProps {}

/** The four render branches, resolved by resolveGraduationSummaryState(). */
export type GraduationSummaryState = 'loading' | 'error' | 'empty' | 'ready';

/** Input to resolveGraduationSummaryState(); query flags collapse to one GraduationSummaryState. */
export interface GraduationSummaryStateInput {
  /** Saved requirement; undefined = not loaded yet, null = none saved (→ 'empty'). */
  requirement: unknown | null | undefined;
  /** Computed progress; undefined = not loaded yet. */
  progress: unknown | null | undefined;
  /** useGraduationRequirement().isLoading → 'loading'. */
  requirementIsLoading: boolean;
  /** useGraduationProgress().isLoading → 'loading'. */
  progressIsLoading: boolean;
  /** useGraduationRequirement().isError → 'error'. */
  requirementIsError: boolean;
  /** useGraduationProgress().isError → 'error'. */
  progressIsError: boolean;
  /** True while the 다시 시도 refetch runs; keeps the card in 'error'. */
  retryingAfterError: boolean;
}

/** Credit counts shared by StackedBar, BreakdownLine and TrackRow. met = required > 0 && earned >= required. */
export interface SegmentValues {
  /** Credits already earned (이수); drawn blue-600, emerald-500 once met. */
  earned: number;
  /** Credits currently enrolled (수강중); drawn sky-400. Default 0. */
  enrolled?: number;
  /** Credits planned (예정); drawn with the blue hatch. Default 0. */
  planned?: number;
  /** Credits required by the rule; the 100% width of the bar. */
  required: number;
}

/** Internal: the stacked earned → enrolled → planned bar inside a gray-100 track. */
export interface StackedBarProps extends SegmentValues {
  /** Track height: 'lg' h-2.5 (hero), 'md' h-2 (track row), 'sm' h-1.5 (sub row). Default 'md'. */
  size?: 'lg' | 'md' | 'sm';
}

/** Internal: the 8px-swatch legend under a bar; collapses to "요건 충족" when met with nothing enrolled or planned. */
export interface BreakdownLineProps extends SegmentValues {
  /** Prior (transcript) credits included in earned; renders "(기이수 N 포함)" when > 0. Default 0. */
  prior?: number;
  /** Extra classes from the caller: 'mt-1.5' (hero) or 'mt-0.5 pl-[72px]' (track rows). Default ''. */
  className?: string;
}

/** Internal: one requirement row — label, bar, "earned/required", legend. */
export interface TrackRowProps extends SegmentValues {
  /** Row label: 전공, 핵심, 주전공최소, 복수전공, 부전공, 교양. */
  label: string;
  /** Prior credits forwarded to BreakdownLine. Default 0. */
  prior?: number;
  /** Indented thin sub-row prefixed "└ " (text-[11px] gray-400, bar size 'sm'). Default false. */
  sub?: boolean;
}

// ----- RequirementForm -----
// RequirementForm — props copied from src/components/features/RequirementForm.tsx (documentation only).

/** Major track of the student; from src/types/index.ts. */
export type MajorType = 'single' | 'double' | 'minor';

/** Shape the form edits and submits. Credits are parsed with parseInt; fields of the other tracks are omitted on submit. */
export interface RequirementFormData {
  /** Which track the credit sections cover; drives the 복수전공 / 부전공 sections. */
  majorType: 'single' | 'double' | 'minor';
  /** 졸업학점 — total credits required (min 1). */
  totalCredits: number;
  /** 전공학점 — primary major credits required. */
  primaryMajorCredits: number;
  /** 전공핵심 (최소) — minimum core credits inside the primary major; must not exceed primaryMajorCredits. */
  primaryMajorRequiredMin: number;
  /** 교양학점 — general education credits required. */
  generalCredits: number;
  /** 복수전공 학점 — only when majorType is 'double'. */
  secondaryMajorCredits?: number;
  /** 복수전공핵심 (최소) — only when majorType is 'double'. */
  secondaryMajorRequiredMin?: number;
  /** 부전공 학점 — only when majorType is 'minor'. */
  minorCredits?: number;
  /** 부전공핵심 (최소) — only when majorType is 'minor'. */
  minorRequiredMin?: number;
  /** 주전공 최소 학점 — primary-major floor when a minor is declared. */
  minorPrimaryMajorMin?: number;
  /** 기이수 졸업학점 — credits already earned per the transcript (default input '0'). */
  earnedTotalCredits: number;
  /** 기이수 전공 — earned primary major credits. */
  earnedPrimaryMajorCredits: number;
  /** 기이수 교양 — earned general education credits. */
  earnedGeneralCredits: number;
  /** 기이수 전공핵심 — earned primary major core credits. */
  earnedPrimaryMajorRequiredCredits: number;
  /** 기이수 복수전공 — only when majorType is 'double'. */
  earnedSecondaryMajorCredits?: number;
  /** 기이수 복수전공핵심 — only when majorType is 'double'. */
  earnedSecondaryMajorRequiredCredits?: number;
  /** 기이수 부전공 — only when majorType is 'minor'. */
  earnedMinorCredits?: number;
  /** 기이수 부전공핵심 — only when majorType is 'minor'. */
  earnedMinorRequiredCredits?: number;
  /** Year of the last semester already counted in the earned credits; null when the cutoff select is "선택 안 함". */
  priorCutoffYear?: number | null;
  /** Term of that semester; null together with priorCutoffYear. */
  priorCutoffTerm?: 'spring' | 'fall' | null;
}

export interface RequirementFormProps {
  /** Existing requirement to edit; when present the submit label reads 수정 instead of 저장. */
  initialData?: RequirementFormData;
  /** Called with the parsed, validated data when the form submits. */
  onSubmit: (data: RequirementFormData) => void;
  /** Called by the 취소 outline button. */
  onCancel: () => void;
  /** Puts the submit Button in its isLoading state (spinner + 로딩중..., disabled). */
  isLoading?: boolean;
  /** When provided, renders the 학과 기준표에서 불러오기 button; resolves with values to prefill, or null. */
  onLoadFromDeptReq?: () => Promise<Partial<RequirementFormData> | null>;
  /** The user's track; hides radio options that do not apply. Undefined shows all three. */
  userMajorType?: MajorType;
  /** Selected value of the year <select> next to the load button (2025 | 2026); the select renders only with onYearChange. */
  requirementYear?: number;
  /** Change handler for the year <select>. */
  onYearChange?: (year: number) => void;
  /** 계획에 존재하는 학기 목록 (기이수 반영 기준 학기 선택지); renders the cutoff <select> when non-empty. Labels look like "2학년 1학기". */
  semesterOptions?: Array<{ year: number; term: 'spring' | 'fall'; label: string }>;
  /** 기준 학기 자동 제안: 계획에서 '이수' 과목이 있는 가장 마지막 학기; drives the amber suggestion banner. */
  suggestedCutoff?: { year: number; term: 'spring' | 'fall'; label: string } | null;
}

// ----- CustomCourseForm -----
// CustomCourseForm — props copied from src/components/features/CustomCourseForm.tsx (documentation only; not type-checked).

/** Course category; from src/types/index.ts. The modal labels them 전공핵심 · 전공필수 · 전공선택 · 교양필수 · 교양선택 · 교직 · 자유선택, in this order. */
export type RequirementCategory =
  | 'major_required'
  | 'major_compulsory'
  | 'major_elective'
  | 'general_required'
  | 'general_elective'
  | 'free_elective'
  | 'teaching';

/** Second argument of onClickAdd. Inlined in the source; named here for readability. */
export interface CustomCourseData {
  /** Auto-generated `CUS-<Date.now() in base 36, upper-case>`; the user never types a code. */
  code: string;
  /** The 과목명 field, as typed. */
  name: string;
  /** The 학점 field (parseInt of the number input; initial 3, min 1, max 12). */
  credits: number;
  /** The 이수구분 selection; always set when this callback fires. */
  category?: RequirementCategory;
  /** The departmentId prop, passed back unchanged. */
  departmentId?: string;
}

export interface CustomCourseFormProps {
  /** Called by the 취소 button and again after a successful create; the parent unmounts the modal. Required. */
  onClose: () => void;
  /** Department the new course is saved under (`department` in the mutation). Undefined shows the amber 학과를 먼저 설정해주세요 line and keeps 추가 disabled. Default undefined. */
  departmentId?: string;
  /** Restricts and orders the 이수구분 options. Undefined lists all seven categories in categoryLabels order. CourseCatalog never passes it. Default undefined. */
  availableCategories?: RequirementCategory[];
  /** Semester the course is added to. `term === 'spring'` renders 1학기, any other term 2학기, in the blue-50 banner. Null or undefined shows the amber-50 banner and keeps 추가 disabled. Default undefined. */
  focusedSemester?: { year: number; term: string } | null;
  /** Called after the create resolves, with the new course's `_id` as a string and the data to place it in the focused semester. Default undefined (the course is created but not placed). */
  onClickAdd?: (courseId: string, courseData: CustomCourseData) => void;
}

/** Client component. Renders its own fixed overlay; no children. Internal state: { name: '', credits: 3, category: '' }. The submit is disabled while `createCourse.isPending || !departmentId || !formData.category || !focusedSemester`. */
export declare function CustomCourseForm(props: CustomCourseFormProps): JSX.Element;

// ----- AddSemesterDialog -----
// AddSemesterDialog — props copied from src/components/features/AddSemesterDialog.tsx (documentation only, not type-checked).
// The source interface is module-private; it is exported here for the design system.

/** Semester half, from src/types/index.ts. 'spring' renders as 1학기, 'fall' as 2학기. */
export type Term = 'spring' | 'fall';

export interface AddSemesterDialogProps {
  /** Mount switch: when false the component returns null (no overlay, no panel); the window keydown listener stays registered while the component is mounted and simply ignores Escape until isOpen is true. */
  isOpen: boolean;
  /** Called on Escape (window keydown), on a click on the overlay outside the panel, and by the 취소 Button. */
  onClose: () => void;
  /** Called on form submit with the chosen grade year (1–5) and term, only when the pair is not a duplicate and isLoading is false. */
  onAdd: (year: number, term: Term) => void;
  /** Semesters already in the plan: seeds the default selection (the one after the latest, year capped at 5; 1학년 1학기 when empty) and drives the duplicate warning. */
  existingSemesters: Array<{ year: number; term: Term }>;
  /** Default false. Disables every control, dims the segments to opacity 0.5 with cursor not-allowed, and puts 추가 in its spinner + 로딩중... state. */
  isLoading?: boolean;
}

/** Function component. No ref, no children, no className; the overlay is `fixed inset-0 z-50`. */
export declare function AddSemesterDialog(props: AddSemesterDialogProps): JSX.Element | null;

// ----- CourseCatalog -----
// CourseCatalog props — adapted from src/components/features/CourseCatalog.tsx (documentation only, not type-checked).

import type { Types } from 'mongoose';

/** Requirement category (src/types/index.ts); drives chip, badge and quick-add colors. */
export type RequirementCategory =
  | 'major_required'    // 전공핵심 · 전핵
  | 'major_compulsory'  // 전공필수 · 전필
  | 'major_elective'    // 전공선택 · 전선
  | 'general_required'  // 교양필수 · 교필
  | 'general_elective'  // 교양선택 · 교선
  | 'free_elective'     // 자유선택 · 자선
  | 'teaching';         // 교직

/** Semester enum (src/types/index.ts); the catalog only filters and groups on 'spring' (1학기) and 'fall' (2학기). */
export type Semester = 'spring' | 'summer' | 'fall' | 'winter';

/** Course document as served by the API (src/types/index.ts). */
export interface ICourse {
  /** Mongo id; stringified for planCourseIds and the dnd-kit id `catalog-{id}`. */
  _id: Types.ObjectId;
  /** Course code; matched by the search box, never rendered. */
  code: string;
  /** Course name; one line, truncated. */
  name: string;
  /** Rendered as `{credits}학점`. */
  credits: number;
  /** Owning department. */
  department?: Types.ObjectId;
  /** Prerequisite course ids (unused here). */
  prerequisites: Types.ObjectId[];
  /** Free-text description (unused here). */
  description?: string;
  /** Semesters the course is offered (unused here). */
  semesters: Semester[];
  /** Category badge / chip; missing or unknown falls back to gray. */
  category?: RequirementCategory;
  /** Recommended year; with recommendedSemester it places the course in a grouped column, otherwise under 기타. */
  recommendedYear?: number;
  /** Recommended semester ('spring' → 1학기, 'fall' → 2학기). */
  recommendedSemester?: Semester;
  /** Set for user-created courses → the 커스텀 tag / ribbon. */
  createdBy?: Types.ObjectId;
  /** Soft-delete flag (unused here). */
  isActive: boolean;
  /** Timestamps (unused here). */
  createdAt: Date;
  updatedAt: Date;
}

/** Payload handed to onClickAdd for both catalog items and quick-add tiles. */
export interface CatalogAddData {
  /** Course code (quick-add generates `PLH-{initials}-{base36 timestamp}`). */
  code: string;
  /** Course name (quick-add: `{카테고리} {n}학점`). */
  name: string;
  /** Credits. */
  credits: number;
  /** Category when known. */
  category?: RequirementCategory;
  /** Department the item was listed under; undefined for quick-add courses. */
  departmentId?: string;
}

/** Semester the planner has focused; switches on the focus banner and the add buttons. */
export interface FocusedSemester {
  /** Academic year (1-based). */
  year: number;
  /** 'spring' renders 1학기, anything else 2학기. */
  term: string;
}

export interface CourseCatalogProps {
  /** Ids of courses already in the plan: rendered as 추가됨 at opacity 0.5 with dragging and the add button disabled. */
  planCourseIds: string[];
  /** Called by the row/card add buttons and the quick-add tiles; without it no add button renders. */
  onClickAdd?: (courseId: string, courseData: CatalogAddData) => void;
  /** Focused semester; null/undefined hides the focus banner and the add buttons. */
  focusedSemester?: FocusedSemester | null;
  /** While true every add button is disabled and gray (card view shows "..."). Default false. */
  isAddingCourse?: boolean;
}

/** Card or single-line rows; the panel defaults to 'list'. */
export type CatalogViewMode = 'card' | 'list';

/** Which department tab is active; 'common' shows the quick-add grid instead of courses. */
export type CatalogDeptFilter = 'primary' | 'secondary' | 'common';

/** Internal draggable item (not exported by the source); listed for the anatomy. */
export interface CatalogCourseItemProps {
  /** The course to render. */
  course: ICourse;
  /** True when the id is in planCourseIds. */
  isInPlan: boolean;
  /** 'list' → row with short badge; 'card' → CourseCard with ribbons. */
  viewMode: CatalogViewMode;
  /** Passed through from the panel. */
  focusedSemester: FocusedSemester | null | undefined;
  /** Passed through from the panel. */
  isAddingCourse: boolean;
  /** Passed through from the panel. */
  onClickAdd?: (courseId: string, data: CatalogAddData) => void;
  /** Department the item is listed under; forwarded in the dnd data and onClickAdd payload. */
  departmentId?: string;
  /** Adds the 복수/부전 badge (secondary) or the 공통 badge/ribbon (common). */
  deptFilter: CatalogDeptFilter;
  /** 'double' → 복수(전공) purple, otherwise 부전(공) orange. */
  majorType: string;
  /** Extra classes on the wrapper (the flat card-grid width classes). */
  className?: string;
}

/** One grouped-view column. */
export interface CourseGroup {
  /** Recommended year; 99 for the trailing 기타 group. */
  year: number;
  /** Column semester. */
  semester: 'spring' | 'fall';
  /** Header text: `{year}학년 {1학기|2학기}` or `기타`. */
  label: string;
  /** Courses in the column. */
  courses: ICourse[];
  /** Sum of credits, rendered as `{n}과목 · {n}학점`. */
  totalCredits: number;
}

/** Quick-add tile definition (COMMON_QUICK_ADD_CATEGORIES). */
export interface QuickAddCategory {
  /** Category created for the placeholder course. */
  key: RequirementCategory;
  /** Tile title: 교양필수 | 교양선택 | 자유선택 | 교직. */
  label: string;
  /** Code prefix: PLH-GR | PLH-GE | PLH-FE | PLH-TC. */
  codePrefix: string;
  /** Tailwind classes for the credit buttons and tile: bg-{hue}-500, hover:bg-{hue}-600, border-{hue}-200, text-{hue}-700, bg-{hue}-50. */
  bgColor: string;
  hoverColor: string;
  borderColor: string;
  textColor: string;
  lightBg: string;
}

// ----- AllPlansModal -----
// AllPlansModal — props copied from src/components/features/AllPlansModal.tsx (documentation only, not type-checked).
// The source interface is module-private; it is exported here for the design system.

/** One list row, from src/types/index.ts AnonymousPlanSummary. Fetched inside the component by useAnonymousPlans; never passed in. */
export interface AnonymousPlanSummary {
  /** Opaque per-department id; handed to AnonymousPlanModal when the plan card is clicked. */
  anonymousId: string;
  /** Credits across the whole plan — rendered as "{totalCredits}학점". */
  totalCredits: number;
  /** Course count — rendered as "{totalCourses}개 과목". */
  totalCourses: number;
  /** Semester count — rendered as "{semesterCount}개 학기". */
  semesterCount: number;
}

export interface AllPlansModalProps {
  /** Mount switch: when false the component returns null and queues a reset of the page (back to 1) and the selected plan (null). */
  isOpen: boolean;
  /** Called on Escape (document keydown) and on a click on the overlay outside the panel — both only while no detail modal is open — and by the 닫기 button. */
  onClose: () => void;
  /** Department whose anonymous plans are listed; forwarded to useAnonymousPlans(departmentId, page, 9, isOpen) and to the AnonymousPlanModal detail. Omitted → the API uses the signed-in user's department, or answers 400 for a guest. */
  departmentId?: string;
}

/** Function component. No ref, no children, no className; the overlay is `fixed inset-0 z-40` and the detail modal opens above it at z-50. */
export declare function AllPlansModal(props: AllPlansModalProps): JSX.Element | null;

// ----- AnonymousPlanModal -----
// AnonymousPlanModal — props copied from src/components/features/AnonymousPlanModal.tsx (documentation only, not type-checked).
// The source interface is module-private; it is exported here for the design system.

/** The fetched plan, from src/types/index.ts AnonymousPlanDetail. Loaded inside the component by useAnonymousPlanDetail(anonymousId, departmentId); never passed in. */
export interface AnonymousPlanDetail {
  /** Opaque per-department id the detail was fetched by. */
  anonymousId: string;
  /** Semesters in storage order; the modal groups them by `year` ascending and sorts with a one-argument comparator `(a) => a.term === 'spring' ? -1 : 1` (spring first for a two-semester year, not a general sort), rendering one ReadOnlySemesterColumn per entry. */
  semesters: Array<{
    /** Academic year — the "{year}학년" group heading and the start of each card title. */
    year: number;
    /** 'spring' renders 1학기 (and is intended to sort first); any other string renders 2학기. */
    term: string;
    /** Course rows handed to ReadOnlySemesterColumn; their total count feeds "{n}과목" in the header. */
    courses: Array<{
      /** Course code, shown under the name in the card row. */
      code: string;
      /** Course name, truncated to one line in the card row. */
      name: string;
      /** Credits, shown as "{credits}학점" in the row and summed by the card. */
      credits: number;
      /** Category key (major_required … free_elective) that picks the card chip's label and colors. */
      category: string;
    }>;
  }>;
  /** Credits across the whole plan — rendered as "총 {totalCredits}학점". */
  totalCredits: number;
}

export interface AnonymousPlanModalProps {
  /** Mount switch: when false the component returns null and the detail query is disabled (the hook receives null). Both call sites pass true and mount the component only while a plan is selected. */
  isOpen: boolean;
  /** Called on Escape (document keydown), on a click on the overlay outside the panel, by the 닫기 button, and automatically 2 seconds after a fetch error. */
  onClose: () => void;
  /** The plan to load with useAnonymousPlanDetail; null disables the query. A 404 (stale id) is not retried (the hook's `meta.onError` invalidation is never wired by the app's QueryClient). */
  anonymousId: string | null;
  /** Department scope forwarded to the detail query; omitted → unscoped. */
  departmentId?: string;
}

/** Function component. No ref, no children, no className; the overlay is `fixed inset-0 z-50`, above AllPlansModal (z-40). */
export declare function AnonymousPlanModal(props: AnonymousPlanModalProps): JSX.Element | null;

// ----- PatchNotePreview -----
// PatchNotePreview — props copied from src/components/features/PatchNotePreview.tsx (the source keeps the interface unexported). Documentation only; not type-checked.

export interface PatchNotePreviewProps {
  /** Announcement title from the admin form; trimmed. Empty → 제목을 입력하세요 in italic gray-400. The notification row shows "새로운 업데이트: " + the first 50 chars + "..." when longer. */
  title: string;
  /** Announcement body from the admin form; trimmed. Empty → 내용을 입력하세요 in italic gray-400. Rendered with whitespace-pre-wrap inside a 256px-capped scroll area (max-h-64). */
  content: string;
  /** Optional version label (the form placeholder is v1.0.0); trimmed and shown as a blue-100 / blue-700 pill only when non-empty. */
  version?: string;
}

/** Client component. Pure render of its props: no state, no fetching, no handlers. The admin patch-notes page mounts it as the second column of a grid next to the form while 미리보기 is toggled on. */
export declare function PatchNotePreview(props: PatchNotePreviewProps): JSX.Element;

// ----- AppHeader -----
// AppHeader (pattern) — adapted from src/app/(dashboard)/layout.tsx. No component exists; this documents the route layout that renders the shell header inline. Documentation only; not type-checked.

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

/** Props of DashboardLayout, the (dashboard) route layout; the header has no props of its own and reads usePathname() and useAuth(). */
export interface AppHeaderProps {
  /** The page rendered inside <main class="container mx-auto px-3 py-4 sm:px-4 sm:py-8">, wrapped in ErrorBoundary and OnboardingGuard. */
  children: ReactNode;
}

/** One entry of primaryNavigation, secondaryNavigation or adminNavigation. */
export interface NavigationItem {
  /** Visible label: 수강 계획 · 학사 일정 · 학과 통계 · 도움말 · 문의 및 건의 · 업데이트 소식 · 관리자. */
  name: string;
  /** Route; primary pills are current on `pathname === href`, 관리자 on `startsWith(href)`, secondary on `=== href || startsWith(href + '/')`. */
  href: string;
  /** lucide-react icon rendered at w-4 h-4 before the label (Calendar, CalendarDays, BarChart3, HelpCircle, MessageSquareText, Megaphone, Shield). */
  icon: LucideIcon;
}

/** Top-level pills in the desktop nav and the mobile menu: 수강 계획 /planner · 학사 일정 /calendar · 학과 통계 /statistics. */
export declare const primaryNavigation: NavigationItem[];
/** Items of the 더보기 dropdown and the mobile 고객 지원 accordion: 도움말 /help · 문의 및 건의 /help/feedback · 업데이트 소식 /patch-notes. */
export declare const secondaryNavigation: NavigationItem[];
/** The purple 관리자 /admin pill, rendered only when !isGuest && isAdmin. */
export declare const adminNavigation: NavigationItem[];

/** A row of the 알림 panel, as returned by GET /api/notifications in `{ success: boolean; data: NotificationItem[] }`. */
export interface NotificationItem {
  /** React key. */
  id: string;
  /** Picks the chip: 'patch-note' (purple-100 + Megaphone), 'feedback-new' (yellow-100, admins only), anything else such as 'feedback-reply' (blue-100). */
  type: string;
  /** Row text in text-sm text-gray-700, e.g. 새로운 업데이트: {title} · 문의에 답변이 달렸습니다. */
  message: string;
  /** Link target of the row; the panel closes on click. */
  href: string;
  /** ISO timestamp rendered through getRelativeTime(). */
  createdAt: string;
}

/** Shape of GET /api/notifications/unread-count; the badge shows `count`, capped at 99+ and coloured by role. */
export interface UnreadCountResponse {
  /** Request status. */
  success: boolean;
  /** Unread notifications for the signed-in user. */
  data: { count: number };
}

/** What the header reads from useAuth(). */
export interface AppHeaderAuthState {
  /** next-auth session user; `name` drives the avatar initial and the user menu, `role === 'admin'` yields isAdmin. */
  user?: { id?: string; name?: string | null; role?: 'student' | 'admin' } | null;
  /** True once the session status is 'authenticated'; gates the bell and the notification queries. */
  isAuthenticated: boolean;
  /** Shows the 관리자 pill and turns the badge yellow-400 / yellow-900. */
  isAdmin: boolean;
  /** Guest mode: swaps the bell and user menu for 구글 로그인 / 회원가입 Buttons and renders the amber banner. */
  isGuest: boolean;
  /** 로그아웃 item and the fallback ghost Button; exits guest mode or signs out and routes away. */
  logout: () => Promise<void>;
  /** 구글 로그인 Button and the banner's 구글로 로그인 link; exits guest mode, then signIn('google'). */
  loginWithGoogle: () => Promise<void>;
}

/** 방금 전 · N분 전 · N시간 전 · N일 전 (under 7 days) · otherwise toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }). */
export declare function getRelativeTime(dateStr: string): string;

/** Client component ('use client'). Keeps mobileMenuOpen, moreMenuOpen, userMenuOpen, notificationMenuOpen and supportMenuOpen; closes the three dropdowns on outside mousedown or Escape. */
export default function DashboardLayout(props: AppHeaderProps): JSX.Element;

// ----- AuthLayout -----
// AuthLayout — a PATTERN, not a component: shapes adapted from src/app/(auth)/login/page.tsx,
// src/app/(auth)/register/page.tsx, src/lib/inapp-browser.ts and src/lib/auth/login-message.ts.
// Documentation only; not type-checked. The two pages reuse ButtonProps and InputProps (see Button.d.ts, Input.d.ts).

/** Both pages are default-exported, prop-less client components; nothing configures the layout from outside. */
export interface AuthLayoutProps {}

/** Local state of LoginPage (useState). */
export interface LoginPageState {
  /** Controlled value of the 이메일 field; default ''. */
  email: string;
  /** Controlled value of the 비밀번호 field; default ''. */
  password: string;
  /** Message shown in the red alert above the fields; '' hides it. Set to LOGIN_FAILURE_MESSAGE when login() throws. */
  error: string;
  /** True from submit until login() settles; combined with useAuth().isLoading into Button isLoading. */
  isSubmitting: boolean;
  /** detectInAppBrowser() result plus an iOS flag; when isInApp the Google button is replaced by the amber notice. */
  inAppInfo: InAppBrowserInfo & { isIOS: boolean };
}

/** Return shape of detectInAppBrowser() in src/lib/inapp-browser.ts (the interface is module-private there). */
export interface InAppBrowserInfo {
  /** True inside a known in-app WebView (KakaoTalk, Everytime, Instagram, Facebook, NAVER, LINE, Daum, Samsung CrossApp, Twitter, TikTok, Band) or a generic WebView. */
  isInApp: boolean;
  /** Korean/English app name for the notice (카카오톡, 에브리타임, 인스타그램, Facebook, 네이버, LINE, 다음, 삼성 인터넷, Twitter, TikTok, 밴드); null for a generic WebView, rendered as '앱'. */
  appName: string | null;
}

/** Controlled form values of RegisterPage, keyed by the <input name>. */
export interface RegisterFormData {
  /** 이름 field; placeholder 홍길동. */
  name: string;
  /** 이메일 field; placeholder email@example.com. */
  email: string;
  /** 비밀번호 field; must match /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).{8,}$/ before submit. */
  password: string;
  /** 비밀번호 확인 field; must equal password before submit. */
  confirmPassword: string;
}

/** Local state of RegisterPage. */
export interface RegisterPageState {
  /** The four controlled values. */
  formData: RegisterFormData;
  /** Alert text: 비밀번호가 일치하지 않습니다. | 비밀번호는 8자 이상이며, 대문자, 소문자, 숫자를 포함해야 합니다. | err.message | 회원가입에 실패했습니다.; '' hides it. */
  error: string;
  /** True from submit until register() settles. */
  isSubmitting: boolean;
}

/** The part of useAuth() (src/hooks/useAuth.ts) these pages consume. */
export interface AuthLayoutAuthHook {
  /** Credentials sign-in through NextAuth; throws Error(LOGIN_FAILURE_MESSAGE) on failure, then routes to /planner. */
  login(email: string, password: string): Promise<void>;
  /** signIn('google', { callbackUrl: '/planner' }) after exitGuestMode(); full-page redirect. */
  loginWithGoogle(): Promise<void>;
  /** POST /api/auth/register then login(); throws Error(result.error) when success is false. */
  register(data: { email: string; password: string; name: string }): Promise<void>;
  /** True while the NextAuth session status is 'loading'; feeds Button isLoading. */
  isLoading: boolean;
}

/** The one login error string, from src/lib/auth/login-message.ts. */
export declare const LOGIN_FAILURE_MESSAGE: '이메일 또는 비밀번호가 올바르지 않습니다. 잠시 후 다시 시도해주세요.';

/** Client page component ('use client'); root <div className="min-h-screen flex">. */
export default function LoginPage(): JSX.Element;

/** Client page component ('use client'); root <div className="flex-1 flex">. Separately default-exported from register/page.tsx. */
export declare function RegisterPage(): JSX.Element;

// ----- PageHeader -----
/**
 * PageHeader — documentation-only types for the page-header PATTERN (title block and actions written
 * inline at the top of each dashboard page). No component exists in the source; these are the values
 * each page's JSX reads, plus the recipe names used by the stylesheet.
 */

/** Which page's header the markup follows. 'planner-export' is the compact duplicate rendered only while isExporting. */
export type PageHeaderRecipe = 'planner' | 'planner-export' | 'statistics' | 'admin';

/** MajorType from src/types — chooses the second badge: 'double' → 복수전공 (purple), 'minor' → 부전공 (orange), 'single' → none. */
export type PageHeaderMajorType = 'single' | 'double' | 'minor';

/** src/app/(dashboard)/planner/page.tsx — values the header JSX reads (session + useDepartments() for members, useGuestProfileStore for guests). */
export interface PlannerPageHeaderProps {
  /** Primary department badge (yu-navy-a10 / yu-navy); when undefined the 학과를 설정해주세요 link to /profile renders instead. */
  departmentName?: string;
  /** session.user.majorType || 'single' for members, the guest store's majorType for guests. */
  headerMajorType: PageHeaderMajorType;
  /** Text after 복수전공: / 부전공:; the second badge renders only when this and a non-'single' majorType are set. */
  secondaryDepartmentName?: string;
  /** activePlan.semesters.length > 0 — shows 내보내기 and 초기화; the actions row itself always renders. */
  hasSemesters: boolean;
  /** Opens the PNG 이미지 / PDF 문서 menu under 내보내기; closed on outside mousedown / touchstart. */
  showExportMenu: boolean;
  /** Disables 내보내기, swaps its label for the gray-600 arc + 내보내는 중..., and renders the export-only header into the capture. */
  isExporting: boolean;
  /** resetPlanMutation.isPending → Button isLoading on 초기화 (spinner + 로딩중..., disabled). */
  isResetting: boolean;
  /** Guests pressing 내보내기 get the Toast 로그인 후 이용할 수 있는 기능입니다. instead of the menu. */
  isGuest: boolean;
  /** PNG 이미지 menu item. */
  onExportPng: () => void;
  /** PDF 문서 menu item. */
  onExportPdf: () => void;
  /** 초기화 — asks window.confirm('모든 학기와 과목이 삭제됩니다. 계획을 초기화하시겠습니까?') first. */
  onReset: () => void;
}

/** src/app/(dashboard)/statistics/page.tsx — fields of stats (useDepartmentStats().data.data) the header reads. */
export interface StatisticsPageHeaderProps {
  /** Lead line: `${departmentName} 학생들이 많이 듣는 과목`. */
  departmentName: string;
  /** Meta line: `${totalStudents}명의 학생 데이터 기반`. */
  totalStudents: number;
  /** ISO date; rendered as `${formatRelativeTime(new Date(updatedAt))} 갱신`. */
  updatedAt: string;
}

/** src/app/(dashboard)/admin/courses/page.tsx — the back link, title row and create button. */
export interface AdminPageHeaderProps {
  /** Back link target; the label is 관리자 대시보드로 돌아가기 with a lucide ArrowLeft. */
  backHref: '/admin';
  /** Page title (과목 관리). */
  title: string;
  /** Record count shown as `등록된 과목을 관리합니다. (${count}건)`. */
  count: number;
  /** openCreateForm — the yu-cyan 과목 추가 button with a lucide Plus. */
  onCreate: () => void;
}

export interface PageHeaderProps {
  /** Recipe to render. */
  recipe: PageHeaderRecipe;
  /** Planner data when recipe is 'planner' or 'planner-export' (the export variant uses only the badge fields). */
  planner?: PlannerPageHeaderProps;
  /** Statistics data when recipe is 'statistics'. */
  statistics?: StatisticsPageHeaderProps;
  /** Admin data when recipe is 'admin'. */
  admin?: AdminPageHeaderProps;
}

// ----- FilterChips -----
/**
 * FilterChips — documentation-only types for the filter-chip PATTERN: rows of toggle <button>s written
 * inline in five places (planner 학년 pills, CourseCatalog 이수 chips, statistics gradient chips, calendar
 * pill chips, admin 개설 학기 toggles). No component exists in the source; these are the option unions
 * each page maps over, the local state it keeps, and the recipe names used by the stylesheet.
 */

/** src/types/index.ts — the seven 이수구분 values (labels: 전공핵심 전공필수 전공선택 교양필수 교양선택 자유선택 교직). */
export type RequirementCategory =
  | 'major_required'
  | 'major_compulsory'
  | 'major_elective'
  | 'general_required'
  | 'general_elective'
  | 'free_elective'
  | 'teaching';

/** src/types/index.ts — admin 개설 학기 options (labels: 1학기 여름학기 2학기 겨울학기). */
export type Semester = 'spring' | 'summer' | 'fall' | 'winter';

/** src/types/index.ts — the two planner terms (statistics semester values are `${year}-${Term}`). */
export type Term = 'spring' | 'fall';

/** src/types/index.ts — calendar categories (labels: 학사 수강신청 시험 공휴일 기타). */
export type AcademicEventCategory = 'academic' | 'registration' | 'exam' | 'holiday' | 'other';

/** The five recipes, named by source; statistics has two sizes. */
export type FilterChipRecipe =
  | 'planner-year'
  | 'catalog-category'
  | 'statistics-category'
  | 'statistics-semester'
  | 'calendar-category'
  | 'admin-semester';

/** The shape every recipe is built from: a local state value, an option list and a setter wired to onClick. */
export interface FilterChipsProps<TValue> {
  /** Options rendered in order; the first is the 전체 sentinel in every recipe except admin-semester. */
  options: ReadonlyArray<{ value: TValue; label: string }>;
  /** Current selection; a chip is active when `value === option.value` (admin: `value.includes(option.value)`). */
  value: TValue | TValue[];
  /** Called with the clicked option's value; statistics also resets `visibleCount` to 3. */
  onChange: (value: TValue) => void;
}

/** src/app/(dashboard)/planner/page.tsx */
export interface PlannerYearFilterState {
  /** null = 전체; set by a pill click and by handleSemesterFocus to the focused semester's year. */
  semesterYearFilter: number | null;
  /** Pill options after 전체: `Array.from(semestersByYear.keys()).sort()`; the row renders only when the map is non-empty. */
  years: number[];
}

/** src/components/features/CourseCatalog.tsx */
export interface CatalogCategoryFilterState {
  /** undefined = 전체. */
  categoryFilter: RequirementCategory | undefined;
  /** Categories present in the fetched courses, in fixed order; the only chips rendered after 전체. Hidden on the 공통 tab. */
  usedCategories: RequirementCategory[];
}

/** src/app/(dashboard)/statistics/page.tsx */
export interface StatisticsFilterState {
  /** 'all' = 전체; one chip per CATEGORY_LABELS key. */
  selectedCategory: 'all' | RequirementCategory;
  /** 'all' = 전체 학기, otherwise `${year}-${Term}`. */
  selectedSemester: 'all' | string;
  /** Built from courseStats[].semesters and semesterDistribution; label `${year}학년 ${1|2}학기`. */
  semesterOptions: Array<{ value: 'all' | string; label: string }>;
}

/** src/app/(dashboard)/calendar/page.tsx */
export interface CalendarCategoryFilterState {
  /** 'all' = 전체 (blue-600); a category value paints the chip with that category's colors. */
  selectedCategory: AcademicEventCategory | 'all';
}

/** src/app/(dashboard)/admin/courses/page.tsx — multi-select inside CourseFormData */
export interface AdminSemesterToggleState {
  /** Active chips; submit shows a warning toast while empty. */
  semesters: Semester[];
  /** Adds the semester if absent, removes it if present. */
  toggleSemester: (sem: Semester) => void;
}

// ----- Badge -----
/**
 * Badge — documentation-only types for the badge/pill PATTERN: inline <span>/<div>/<p> recipes the pages repeat
 * without a component. No component exists in the source; these are the values each page's JSX reads to pick a
 * recipe, plus the modifier names used by the stylesheet (.cp-badge--<recipe>).
 */

/** Every stylesheet recipe, named by what it labels in the source. */
export type BadgeRecipe =
  | 'admin' | 'student'                       // admin/users role (font-semibold, Shield / User h-3 w-3)
  | 'pending' | 'resolved'                    // admin/feedback + help/feedback status (font-medium, Clock / CheckCircle h-3 w-3)
  | 'reply'                                   // 관리자 답변 (px-2 font-semibold, Reply h-3 w-3 on the admin page only)
  | 'draft' | 'published'                     // admin/patch-notes status (font-semibold, no icon)
  | 'google' | 'email'                        // admin/users sign-in provider (font-medium)
  | 'student-id' | 'dept-code' | 'version' | 'credits' // identity: 학번 · department code · vX.Y.Z (px-2) · N학점 (px-2)
  | 'department' | 'double' | 'minor'         // planner header (items-center font-medium)
  | 'eyebrow'                                 // help pages (px-3 py-1 gap-2 font-semibold), combined with an EyebrowTone
  | 'count' | 'count-admin'                   // layout.tsx bell counter (absolute, 18px, text-[10px] font-bold)
  | 'chip' | 'chip-patch-note' | 'chip-feedback-new' // layout.tsx 32px notification icon circles
  | 'mini'                                    // admin/users plan rows (text-[10px] inline), combined with a PlanCourseStatus
  | 'legend';                                 // planner/page.tsx 예정 ↔ 이수 legend (rounded 4px), combined with 'planned' | 'completed'

/** src/app/(dashboard)/admin/users/page.tsx — UserItem fields that choose the three badges on a user row. */
export interface UserRowBadgesProps {
  /** 'admin' → 관리자 (red-100 / red-700, Shield); 'student' → 학생 (blue-100 / blue-700, User). */
  role: 'student' | 'admin';
  /** 'google' → Google (yellow-100 / yellow-700); 'credentials' → 이메일 (gray-100 / gray-700). */
  provider: 'credentials' | 'google';
  /** When set, rendered as the purple 학번 badge before the role badge. */
  studentId?: string;
}

/** Status of a course inside a plan (PlanCourse.status); drives the 10px pill in the expanded 수강 계획표. */
export type PlanCourseStatus = 'planned' | 'enrolled' | 'completed' | 'failed';

/** src/app/(dashboard)/admin/users/page.tsx — getStatusLabel / getStatusColor for one course row. */
export interface PlanStatusMiniBadgeProps {
  /** 'completed' → 이수 (green) · 'enrolled' → 수강중 (blue) · 'failed' → 미이수 (red) · 'planned' and anything else → 계획 (slate). */
  status: PlanCourseStatus;
}

/** src/app/(dashboard)/admin/feedback/page.tsx and help/feedback/page.tsx — FeedbackStatus. */
export interface FeedbackStatusBadgeProps {
  /** 'pending' → 대기중 with Clock (yellow-100 / yellow-700); 'resolved' → 해결됨 with CheckCircle (green-100 / green-700). */
  status: 'pending' | 'resolved';
}

/** src/app/(dashboard)/admin/patch-notes/page.tsx — PatchNoteStatus from src/types, labelled by STATUS_LABELS / STATUS_COLORS. */
export interface PatchNoteStatusBadgeProps {
  /** 'draft' → 초안 (yellow-100 / yellow-700); 'published' → 발행됨 (green-100 / green-700). */
  status: 'draft' | 'published';
  /** Optional version string (e.g. v1.0.0) rendered as the blue px-2 badge before the status. */
  version?: string;
}

/** src/app/(dashboard)/planner/page.tsx — values the header badge row reads (session + useDepartments, or the guest profile store). */
export interface PlannerHeaderBadgesProps {
  /** Primary badge text (yu-navy-a10 / yu-navy); when undefined the 학과를 설정해주세요 link renders instead. */
  departmentName?: string;
  /** 'double' → 복수전공: … (purple-100 / purple-700) · 'minor' → 부전공: … (orange-100 / orange-700) · 'single' → no second badge. */
  majorType: 'single' | 'double' | 'minor';
  /** Text after the 복수전공: / 부전공: prefix; the second badge renders only when this and a non-'single' majorType are set. */
  secondaryDepartmentName?: string;
}

/** Color pair of an eyebrow pill. */
export type EyebrowTone =
  | 'slate'   // bg-slate-100 text-slate-700 — 도움말 가이드, Contact, STEP 1 / STEP 2
  | 'cyan'    // bg-[#00AACA]/10 text-[#00AACA] — 빠른 문의
  | 'purple'  // bg-purple-50 text-purple-600 — 내 문의 내역
  | 'navy';   // bg-[#153974]/5 text-[#153974] — 졸업 정보 가이드

/** src/app/(dashboard)/help/page.tsx, help/feedback/page.tsx, help/graduation-guide/page.tsx — one eyebrow pill above a section title. */
export interface EyebrowBadgeProps {
  /** Which color pair. */
  tone: EyebrowTone;
  /** Pill text, e.g. 도움말 가이드. */
  label: string;
  /** Lucide icon rendered at h-3.5 w-3.5 before the label (HelpCircle, MessageSquare, Send, MessageSquareText, GraduationCap); STEP pills have none. */
  icon?: string;
  /** help and help/feedback add mb-3 (the --eyebrow-spaced modifier); graduation-guide renders a <p> without it. */
  spaced?: boolean;
}

/** src/app/(dashboard)/layout.tsx — the unread counter on the bell button. */
export interface BellCountBadgeProps {
  /** Rendered only when > 0; shows the number, or 99+ past 99. */
  unreadCount: number;
  /** true → bg-yellow-400 text-yellow-900; false → bg-red-500 text-white. */
  isAdmin: boolean;
}

/** src/app/(dashboard)/layout.tsx — NotificationItem.type picks the 32px icon circle of a panel row. */
export interface NotificationChipProps {
  /** 'patch-note' → purple-100 + Megaphone purple-600 · 'feedback-new' → yellow-100 + MessageSquareText yellow-600 · any other string → blue-100 + MessageSquareText blue-600. */
  type: 'patch-note' | 'feedback-new' | string;
}

export interface BadgeProps {
  /** Recipe to render. */
  recipe: BadgeRecipe;
  /** Text content (none for 'chip' recipes). */
  children?: string;
}

// ----- Callout -----
/**
 * Callout — documentation-only types for the callout PATTERN: tinted banners written inline in seven
 * files (statistics guest + info callouts, the layout guest strip, the login error + in-app notice, the
 * admin error banner, the CustomCourseForm strips, the RequirementForm help + suggestion boxes, the
 * feedback admin reply). No component exists in the source; these are the recipe names used by the
 * stylesheet and the page state each banner is toggled by.
 */

/** The eleven recipes, named by source file; one `.cp-callout--<recipe>` modifier each. */
export type CalloutRecipe =
  | 'stat-guest'
  | 'stat-info'
  | 'login-error'
  | 'admin-error'
  | 'guest-strip'
  | 'form-info'
  | 'form-warning'
  | 'req-help'
  | 'req-suggest'
  | 'reply'
  | 'inapp';

/** Color family a recipe draws from: amber (guest / warning), blue (info), red (error), green (admin reply). */
export type CalloutTone = 'amber' | 'blue' | 'red' | 'green';

/** Lucide icon a recipe leads with; the login, admin, form-strip and reply recipes have none. */
export type CalloutIcon = 'log-in' | 'info' | 'alert-triangle' | 'help-circle';

/** The shape every recipe is built from — a container, optional icon, one or two lines, at most one action pair. */
export interface CalloutProps {
  /** Which inline recipe this markup is. */
  recipe: CalloutRecipe;
  /** Color family (fixed per recipe). */
  tone: CalloutTone;
  /** Leading lucide icon, when the recipe has one. */
  icon?: CalloutIcon;
  /** Emphasised first line (stat-guest, stat-info, inapp). */
  title?: string;
  /** Body text; the sole line of the error boxes and form strips. */
  body?: string;
  /** Label of the filled <button> (stat-guest 구글로 로그인, req-suggest …까지로 설정, inapp 외부 브라우저에서 열기). */
  action?: string;
  /** Label of the underlined link or link-styled button (회원가입하기, 구글로 로그인, 확인 방법 보기). */
  link?: string;
  /** next/link target of `link`: '/register' or '/help/graduation-guide'. */
  href?: string;
}

/** src/app/(dashboard)/statistics/page.tsx — renders stat-guest when `isGuest`, stat-info always. */
export interface StatisticsCalloutState {
  /** From useAuth(); shows the amber guest callout. */
  isGuest: boolean;
  /** From useAuth(); onClick of the amber 구글로 로그인 button. */
  loginWithGoogle: () => void;
  /** stats.departmentName — the <strong> run in the info callout. */
  departmentName: string;
}

/** src/app/(dashboard)/layout.tsx — renders guest-strip between the header and <main> when `isGuest`. */
export interface GuestStripState {
  /** From useAuth(). */
  isGuest: boolean;
  /** onClick of the underlined 구글로 로그인 <button>; 회원가입하기 is a Link to /register. */
  loginWithGoogle: () => void;
}

/** src/app/(auth)/login/page.tsx — login-error above the fields, inapp in place of the Google Button. */
export interface LoginCalloutState {
  /** '' hides the red box; set to LOGIN_FAILURE_MESSAGE when login() throws. */
  error: string;
  /** detectInAppBrowser() plus an iOS user-agent test, run once on mount. */
  inAppInfo: {
    /** Shows the amber notice instead of the Google Button. */
    isInApp: boolean;
    /** Known app name (카카오톡, 에브리타임, 인스타그램, Facebook, 네이버, LINE, 다음, 삼성 인터넷, Twitter, TikTok, 밴드) or null → '앱'. */
    appName: string | null;
    /** true renders the ꞏꞏꞏ / 공유 / "Safari로 열기" hint; false renders the 외부 브라우저에서 열기 button. */
    isIOS: boolean;
  };
  /** onClick of the Android button; returns how it tried to leave the WebView. */
  openInExternalBrowser: (url?: string) => 'redirected' | 'ios' | 'unknown';
}

/** src/app/(dashboard)/admin/courses/page.tsx — admin-error replaces the course list. */
export interface AdminErrorState {
  /** useQuery error for ['admin-courses', …]; any value renders the fixed message. */
  error: Error | null;
}

/** src/components/features/CustomCourseForm.tsx — form-info or form-warning (either/or). */
export interface CustomCourseFormStripState {
  /** Set → blue strip "{year}학년 {1학기|2학기}에 바로 추가됩니다."; null → amber strip. */
  focusedSemester?: { year: number; term: string } | null;
}

/** src/components/features/RequirementForm.tsx — req-help always; req-suggest when the guard below is true. */
export interface RequirementFormCalloutState {
  /** Last semester with '이수' courses in the plan; the button sets priorCutoff to `${year}-${term}`. */
  suggestedCutoff?: { year: number; term: 'spring' | 'fall'; label: string } | null;
  /** Current cutoff ('' = unset) — picks which of the two suggestion sentences renders. */
  priorCutoff: string;
  /** suggestedCutoff && suggestionAhead && hasPriorCredits && (priorCutoff === '' || earnedEdited). */
  showCutoffSuggestion: boolean;
}

/** src/app/(dashboard)/help/feedback/page.tsx — reply renders inside an item when `adminReply` is set. */
export interface FeedbackReplyState {
  /** The admin's answer, rendered white-space: pre-wrap. */
  adminReply?: string;
  /** ISO date shown beside the 관리자 답변 pill via toLocaleDateString('ko-KR', …). */
  adminReplyAt?: string;
}

// ----- StatusStates -----
/**
 * StatusStates — documentation-only types for the status-state PATTERN (loading, empty and error
 * markup repeated inline in pages). No component exists in the source; these are the props of the
 * Next.js special files and the guard that render it, plus the recipe names used by the stylesheet.
 */

/** Props Next.js passes to src/app/(dashboard)/error.tsx and src/app/global-error.tsx. */
export interface ErrorPageProps {
  /** The thrown error; `digest` is Next's hash for server-side errors. `message` renders only when NODE_ENV !== 'production'. */
  error: Error & { digest?: string };
  /** Re-renders the failed segment; both files call it from the 다시 시도 button. */
  reset: () => void;
}

/** src/components/providers/OnboardingGuard.tsx */
export interface OnboardingGuardProps {
  /** Rendered once the stores are hydrated and the session is authenticated and onboarded; the arc spinner shows meanwhile. */
  children: React.ReactNode;
}

/** The three spinner recipes, named by source: loading.tsx ring, OnboardingGuard arc (planner at 48px), Lucide Loader2. */
export type StatusSpinnerRecipe = 'ring' | 'arc' | 'arc-lg' | 'loader';

/** Skeleton recipes: RequirementsSummary bar, admin title and blocks (block-lg = h-64), calendar cell. */
export type StatusSkeletonRecipe = 'bar' | 'title' | 'block' | 'block-lg' | 'cell';

/** Statistics Card icon variants: BarChart3 (no data), AlertCircle (fetch error), Info (department not set). */
export type StatusStatIcon = 'bar-chart-3' | 'alert-circle' | 'info';

/** Which piece of the pattern a block of markup renders. */
export type StatusStateKind =
  | 'loading'
  | 'skeleton'
  | 'error-page'
  | 'global-error'
  | 'not-found'
  | 'stat-card'
  | 'empty-box'
  | 'list-empty'
  | 'banner';

export interface StatusStatesProps {
  /** The state block being rendered. */
  kind: StatusStateKind;
  /** Spinner recipe when `kind` is 'loading'. */
  spinner?: StatusSpinnerRecipe;
  /** Skeleton recipe when `kind` is 'skeleton'. */
  skeleton?: StatusSkeletonRecipe;
  /** Heading text — the <h2> of a page column or stat card, or the first line of a list empty state. */
  title?: string;
  /** Body text — the <p> under the heading, or the sole line of the admin box and banner. */
  body?: string;
  /** Action label: a <button onClick={reset}> on the error pages, a next/link on the 404 and the stat card. */
  action?: string;
  /** href of the Link variants: '/planner' on not-found.tsx, '/profile' on the statistics Cards. */
  href?: string;
  /** Statistics Card icon when `kind` is 'stat-card'. */
  icon?: StatusStatIcon;
}

// ----- Statistics -----
// Statistics — pattern from src/app/(dashboard)/statistics/page.tsx (documentation only, not type-checked).
// The page's default export is a Next.js client component with no props; the shapes below are what the three
// data-view Cards and the guest CTA pair render, copied from src/types/index.ts and the page's module constants.

/** Requirement category keys (src/types/index.ts). */
export type RequirementCategory =
  | 'major_required'    // 전공핵심
  | 'major_compulsory'  // 전공필수
  | 'major_elective'    // 전공선택
  | 'general_required'  // 교양필수
  | 'general_elective'  // 교양선택
  | 'free_elective'     // 자유선택
  | 'teaching';         // 교직

/** One ranking row (src/types/index.ts CourseStat). */
export interface CourseStat {
  /** Mongo id; the React key of the row. */
  courseId: string;
  /** Course code, rendered before " · {credits}학점". */
  code: string;
  /** Course name — the truncating <h3>. */
  name: string;
  /** Credits, rendered as "{credits}학점". */
  credits: number;
  /** A RequirementCategory key (typed string in the source); indexes CATEGORY_LABELS and CATEGORY_COLORS for the badge. */
  category: string;
  /** Distinct students who planned the course — rendered as "({studentCount}명)". */
  studentCount: number;
  /** studentCount / totalStudents × 100 — the bar width (style width: `${percentage}%`) and the "{percentage.toFixed(1)}%" label. */
  percentage: number;
  /** Semesters the course appears in; feeds the semester filter only. */
  semesters: Array<{ year: number; term: string }>;
}

/** One stat tile (src/types/index.ts SemesterDistribution). */
export interface SemesterDistribution {
  /** Academic year, rendered as "{year}학년". */
  year: number;
  /** 'spring' renders 1학기; anything else renders 2학기. */
  term: string;
  /** Rendered as "{avgCourses.toFixed(1)}과목". */
  avgCourses: number;
  /** Rendered as "{avgCredits.toFixed(1)}학점". */
  avgCredits: number;
}

/** The useDepartmentStats payload (src/types/index.ts DepartmentCourseStats). */
export interface DepartmentCourseStats {
  /** Department id the stats were computed for. */
  departmentId: string;
  /** Used in the page header and info banner, not inside these Cards. */
  departmentName: string;
  /** "{totalStudents}명 중 …" in the ranking subtitle. */
  totalStudents: number;
  /** ISO date; formatted by formatRelativeTime in the page header. */
  updatedAt: string;
  /** Ranked rows; filtered by category and semester, then sliced to visibleCount. */
  courseStats: CourseStat[];
  /** One tile per semester. */
  semesterDistribution: SemesterDistribution[];
}

/** One plan tile (src/types/index.ts AnonymousPlanSummary); from useAnonymousPlans(departmentId, 1, 3, !isGuest). */
export interface AnonymousPlanSummary {
  /** Opaque id; the React key and the AnonymousPlanModal target. */
  anonymousId: string;
  /** Rendered as "{totalCredits}학점". */
  totalCredits: number;
  /** Rendered as "{totalCourses}개 과목". */
  totalCourses: number;
  /** Rendered as "{semesterCount}개 학기". */
  semesterCount: number;
}

/** Values the pattern renders, as the page derives them in render; StatisticsPage itself takes no props. */
export interface StatisticsProps {
  /** Department statistics; null, loading and error fall to the page-level states, not this pattern. */
  stats: DepartmentCourseStats;
  /** courseStats after the category and semester filters; rank = index + 1 within this list. */
  filteredCourses: CourseStat[];
  /** Rows shown: starts at 3, +5 per 더보기, back to 3 on 접기 or any filter change. */
  visibleCount: number;
  /** max(0, filteredCourses.length − visibleCount): "{remainingCount}개 더보기" while > 0, otherwise 접기. */
  remainingCount: number;
  /** Guest mode: swaps the plan grid for the locked message and the CTA pair. */
  isGuest: boolean;
  /** First page (3) of anonymous plans and the total; undefined while loading. Member variant only. */
  plansData?: { plans: AnonymousPlanSummary[]; total: number };
  /** Shows the centered Loader2 in place of the plan grid. */
  plansLoading: boolean;
  /** 구글로 로그인 handler from useAuth(). */
  loginWithGoogle: () => void;
  /** Plan tile click: opens AnonymousPlanModal for that id. */
  onSelectPlan: (anonymousId: string) => void;
  /** 전체 {total}개 수강계획 보기: opens AllPlansModal (the button renders only when total > 3). */
  onOpenAllPlans: () => void;
}

/** Badge text per category — a module constant in the page. */
export declare const CATEGORY_LABELS: Record<RequirementCategory, string>;
/** Badge Tailwind classes per category, e.g. 'bg-red-100 text-red-700' — a module constant in the page. */
export declare const CATEGORY_COLORS: Record<RequirementCategory, string>;

/** The page's default export: a client component with no props and no ref. */
export declare function StatisticsPage(): JSX.Element;

// ----- Onboarding -----
/**
 * Onboarding — documentation-only types for the onboarding PATTERN: the first-run wizard markup in
 * src/app/(dashboard)/onboarding/page.tsx and the profile banner in src/app/(dashboard)/profile/page.tsx.
 * No component exists in the source: both files are default-exported Next.js pages that take no props.
 * These interfaces name the page state that drives each piece and the recipe names the stylesheet uses.
 */

/** src/types/index.ts — the major track a student follows. */
export type MajorType = 'single' | 'double' | 'minor';

/** The wizard step; `useState(1)` in the source, only ever 1 or 2. */
export type OnboardingStep = 1 | 2;

/** One stepper circle's look: current (navy→blue gradient), done (emerald Check), upcoming (gray-200). */
export type OnboardingStepState = 'current' | 'done' | 'upcoming';

/** A 복수전공 / 부전공 toggle's look: off, on (purple for double, orange for minor), disabled (부전공 while double is on). */
export type MajorTypeToggleState = 'off' | 'on' | 'disabled';

/** Department row from useDepartments(), mapped to SearchableSelect options { value: _id, label: name, group: college }. */
export interface OnboardingDepartment {
  /** Mongo id; becomes `departmentId` / `secondaryDepartmentId`. */
  _id: string;
  /** Department code (unused by the page). */
  code: string;
  /** Option label and the banner's department badge text. */
  name: string;
  /** Option group header; also sent to /api/department-requirements. */
  college?: string;
}

/** The step-2 numbers, as sent to useCompleteOnboarding (`graduationRequirements`) or the guest graduation store. */
export interface OnboardingGraduationRequirements {
  /** Chosen in step 1; decides which extra columns render. */
  majorType: MajorType;
  /** 졸업학점 — default 120, must be ≥ 1 (졸업학점은 1 이상이어야 합니다.). */
  totalCredits: number;
  /** 교양학점 — default 30. */
  generalCredits: number;
  /** 전공학점 — default 63. */
  primaryMajorCredits: number;
  /** 전공핵심 (최소) — default 24. */
  primaryMajorRequiredMin: number;
  /** 복수전공 전공학점 — double only, default 36. */
  secondaryMajorCredits?: number;
  /** 복수전공 전공핵심 (최소) — double only, default 12. */
  secondaryMajorRequiredMin?: number;
  /** 부전공 전공학점 — minor only, default 21. */
  minorCredits?: number;
  /** 부전공 전공핵심 (최소) — minor only, default 9. */
  minorRequiredMin?: number;
  /** 부전공시 주전공 최소학점 — minor only, default 0. */
  minorPrimaryMajorMin?: number;
  /** 기이수 졸업학점 — default 0. */
  earnedTotalCredits: number;
  /** 기이수 교양학점 — default 0. */
  earnedGeneralCredits: number;
  /** 기이수 전공학점 — default 0. */
  earnedPrimaryMajorCredits: number;
  /** 기이수 전공핵심학점 — default 0. */
  earnedPrimaryMajorRequiredCredits: number;
  /** 기이수 복수전공 전공학점 — double only. */
  earnedSecondaryMajorCredits?: number;
  /** 기이수 복수전공 전공핵심 — double only. */
  earnedSecondaryMajorRequiredCredits?: number;
  /** 기이수 부전공 전공학점 — minor only. */
  earnedMinorCredits?: number;
  /** 기이수 부전공 전공핵심 — minor only. */
  earnedMinorRequiredCredits?: number;
  /** 기준 연도 — default DEFAULT_REQUIREMENT_YEAR (2025); the <select> offers 2025 and 2026. */
  requirementYear: number;
}

/** Page state behind the wizard (OnboardingPage itself has no props). */
export interface OnboardingProps {
  /** Which Card renders and how the stepper paints. */
  step: OnboardingStep;
  /** Options for both SearchableSelects; the secondary one filters out `departmentId`. */
  departments: OnboardingDepartment[];
  /** While true the 학과 select is disabled with placeholder 불러오는 중.... */
  isDeptLoading: boolean;
  /** Selected primary department; the toggle block renders only once it is set. */
  departmentId: string;
  /** Raw text of the 입학연도 number input (placeholder 예: 2024); validated 2000 … current year + 1. */
  enrollmentYear: string;
  /** 'single' | 'double' | 'minor' — default 'single'. */
  majorType: MajorType;
  /** Which toggles render; default ['single', 'double', 'minor'], refreshed from /api/department-requirements. */
  availableMajorTypes: MajorType[];
  /** 복수전공 학과 / 부전공 학과 selection; must differ from `departmentId`. */
  secondaryDepartmentId: string;
  /** Step-2 numbers (see OnboardingGraduationRequirements). */
  requirements: OnboardingGraduationRequirements;
  /** 학과 기준표에서 불러왔습니다. 수정할 수 있습니다. — set after a successful auto-fill, rendered as the emerald notice. */
  autoFillMessage: string;
  /** Current validation / request error, rendered as the red-500 line; '' hides it. */
  error: string;
  /** completeMutation.isPending (signed-in users only): 완료 becomes 처리 중... and is disabled. */
  isPending: boolean;
  /** Guest mode writes to the local stores instead of calling the API. */
  isGuest: boolean;
}

/** The stepper piece alone. */
export interface OnboardingStepperProps {
  /** 1: step 1 current, step 2 upcoming, empty track. 2: step 1 done (Check), filled connector, step 2 current. */
  step: OnboardingStep;
}

/** The toggle pair; the same markup is repeated in profile/page.tsx 전공 설정 (guest and authenticated). */
export interface MajorTypeToggleProps {
  /** Current value; 'double' turns the 복수전공 button on and disables 부전공, 'minor' turns 부전공 on. */
  majorType: MajorType;
  /** A button renders only when its type is listed; default all three. profile/page.tsx always renders both. */
  availableMajorTypes?: MajorType[];
  /** Clicking an off button selects its type; clicking the on button returns to 'single'. Both clear the secondary department. */
  onChange: (next: MajorType) => void;
}

/** Profile banner data (profile/page.tsx, authenticated view only). */
export interface ProfileBannerProps {
  /** userProfile.name ?? session.user.name; the avatar shows its first character upper-cased (fallback 'U'), the heading the name (fallback 사용자). */
  name?: string;
  /** Renders the yu-navy department badge when set. */
  department?: Pick<OnboardingDepartment, '_id' | 'code' | 'name'> | null;
  /** Renders the yu-cyan {year}년 입학 badge when set. */
  enrollmentYear?: number | null;
  /** 'double' → purple 복수전공 badge, 'minor' → orange 부전공 badge, 'single' or undefined → no badge. */
  majorType?: MajorType;
  /** Appended to the major-type badge as ": {name}" when set. */
  secondaryDepartment?: Pick<OnboardingDepartment, '_id' | 'code' | 'name'> | null;
}

// ----- CalendarGrid -----
/**
 * CalendarGrid — documentation-only types for the academic calendar PATTERN in
 * src/app/(dashboard)/calendar/page.tsx. No component exists in the source: the page builds the
 * header, filter chips, month grid, detail Card, month list and form modal inline from these shapes.
 */
import type { AcademicEventCategory, CreateAcademicEventInput } from '@/types';

export type { AcademicEventCategory, CreateAcademicEventInput };

/** Unified display row for DB events and generated Korean holidays (page.tsx `interface CalendarEvent`). */
export interface CalendarEvent {
  /** Mongo id as a string, or `holiday-${startDate}-${i}` for a generated holiday. */
  _id: string;
  /** Chip, row and detail title text. */
  title: string;
  /** Rendered `text-sm text-gray-700` in the detail Card when present. */
  description?: string;
  /** ISO string; the grid keys cells by its local YYYY-MM-DD. */
  startDate: string;
  /** ISO string; absent = single-day. More than 7 days after startDate = "long" (italic, start/end cells only). */
  endDate?: string;
  /** Picks the color pair from `categoryColors` and the label from `categoryLabels`. */
  category: AcademicEventCategory;
  /** Custom hex stored in the DB; carried in the shape but never applied by the page. */
  color?: string;
  /** Adds the `🔴 ` prefix in chips and rows and the `🔴 공휴일` line in the detail Card. */
  isHoliday: boolean;
  /** true for auto-generated Korean holidays: not editable and left out of 이번 달 일정. */
  isSystemHoliday?: boolean;
}

/** Controlled state of the create/edit modal (page.tsx `interface EventFormData`). */
export interface EventFormData {
  /** Required; `제목과 시작일은 필수입니다.` toast when empty. */
  title: string;
  /** Optional; trimmed, empty → undefined on submit. */
  description: string;
  /** YYYY-MM-DD from <input type="date">; required. */
  startDate: string;
  /** YYYY-MM-DD; `min` is startDate; empty → undefined on submit. */
  endDate: string;
  /** Default 'academic'. */
  category: AcademicEventCategory;
  /** The 공휴일로 표시 checkbox; default false. */
  isHoliday: boolean;
}

/** Value of the filter chip row: 전체 or one category. */
export type CalendarCategoryFilter = AcademicEventCategory | 'all';

/** Visual state of one day cell. */
export type CalendarDayState = 'default' | 'today' | 'selected' | 'today-selected';

/** Korean label per category: 학사 · 수강신청 · 시험 · 공휴일 · 기타. */
export type CategoryLabels = Record<AcademicEventCategory, '학사' | '수강신청' | '시험' | '공휴일' | '기타'>;

/** Tailwind class string per category, e.g. 'bg-blue-100 text-blue-700 border-blue-200'. */
export type CategoryColors = Record<AcademicEventCategory, string>;

/** What the page computes and hands to its inline markup, listed as if it were props. */
export interface CalendarGridProps {
  /** First day of the displayed month; renders `{month + 1}월` and `{year}년`. */
  currentDate: Date;
  /** `new Date()` at render; marks the today cell. */
  today: Date;
  /** Toggled by clicking a cell; drives the amber selected state and the mobile day panel. Default null. */
  selectedDate: Date | null;
  /** Event clicked in a chip or row; renders the border-l-4 detail Card. Default null. */
  selectedEvent: CalendarEvent | null;
  /** Active filter chip. Default 'all'. */
  selectedCategory: CalendarCategoryFilter;
  /** Local YYYY-MM-DD → events on that day (long events only on their start and end day). */
  eventsByDate: Map<string, CalendarEvent[]>;
  /** Leading nulls for the empty cells before day 1, then one Date per day of the month. */
  calendarDays: (Date | null)[];
  /** Non-system events of the month sorted by startDate; feeds 이번 달 일정. */
  sortedEvents: CalendarEvent[];
  /** From useAuth(); shows 일정 추가 and edit/delete, and makes desktop cells clickable. */
  isAdmin: boolean;
  /** TanStack isLoading; swaps the grid for 35 pulsing cells and the list for five h-16 rows. */
  isLoading: boolean;
  /** Modal visibility. */
  showEventForm: boolean;
  /** Event being edited, or null for 일정 추가. */
  editingEvent: CalendarEvent | null;
  /** Controlled form values. */
  formData: EventFormData;
  /** Prev/next chevron; also clears selectedEvent and selectedDate. */
  onNavigateMonth: (direction: 'prev' | 'next') => void;
  /** 오늘 button; jumps to the current month and clears both selections. */
  onGoToToday: () => void;
  /** Filter chip click. */
  onSelectCategory: (category: CalendarCategoryFilter) => void;
  /** Day cell click; toggles selectedDate, and for admins opens the form prefilled with that date. */
  onDateClick: (date: Date) => void;
  /** Chip or row click; sets selectedEvent (stopPropagation on chips). */
  onEventClick: (event: CalendarEvent) => void;
  /** 일정 추가; opens the empty form. */
  onCreateEvent: () => void;
  /** Pencil; ignored for system holidays. */
  onEditEvent: (event: CalendarEvent) => void;
  /** Trash2; native confirm('이 일정을 삭제하시겠습니까?') then the delete mutation. */
  onDeleteEvent: (id: string) => Promise<void>;
  /** Form submit; validates title and startDate, then create or update. */
  onSubmitEvent: (e: React.FormEvent) => Promise<void>;
}

// ----- HelpSection -----
/**
 * HelpSection — documentation-only types for the help-article PATTERN (src/app/(dashboard)/help/page.tsx and
 * src/app/(dashboard)/help/graduation-guide/page.tsx). No component exists; the help page writes its sections inline
 * and the guide maps over the FlowStep data below (copied from the guide source).
 */

import type { LucideIcon } from 'lucide-react';

/** Icon tile tint used by section headings: navy = bg-[#153974]/10, blue = bg-[#3069B3]/10, cyan = bg-[#00AACA]/10, purple = bg-purple-100. */
export type HelpTileTint = 'navy' | 'blue' | 'cyan' | 'purple';

/** One step section of the graduation guide (interface FlowStep in graduation-guide/page.tsx). */
export interface FlowStep {
  /** Stable key, e.g. 'homepage-portal'. */
  id: string;
  /** Eyebrow pill text, e.g. 'STEP 1'. */
  badge: string;
  /** h2 text beside the icon tile. */
  title: string;
  /** Paragraph under the title; empty in the source, which still renders an empty <p> with mt-3. */
  description: string;
  /** Rows of the ordered list, numbered in yu-navy circles. */
  steps: string[];
  /** Screenshot shown in the media pane and the lightbox. */
  imageSrc: string;
  imageAlt: string;
  /** Text of the white strip under the image; empty in the source, which leaves a 45px empty strip. */
  imageCaption: string;
  imageWidth: number;
  imageHeight: number;
  /** Lucide icon for the tile (Search, BookOpen in the source). */
  icon: LucideIcon;
  /** Tailwind classes for the icon color and tile fill, e.g. 'text-[#153974]' and 'bg-[#153974]/10'. */
  iconColorClass: string;
  iconBgClass: string;
}

/** One audit box (auditCheckItems in graduation-guide/page.tsx). */
export interface AuditCheckItem {
  title: string;
  description: string;
}

/** The guide's lightbox state (interface ZoomImage); null when closed. Escape closes it and body scroll is locked while open. */
export interface ZoomImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

// ----- AdminList -----
// AdminList — pattern shapes adapted from src/app/(dashboard)/admin/page.tsx, admin/courses/page.tsx, admin/users/page.tsx and admin/departments/page.tsx. Documentation only; not type-checked.
// No component exists: each page owns this state and renders the markup inline. The unions are copied from src/types/index.ts.

/** Course category keys; the admin pages label and color them through CATEGORY_LABELS / CATEGORY_COLORS. */
export type RequirementCategory =
  | 'major_required'    // 전공핵심
  | 'major_compulsory'  // 전공필수
  | 'major_elective'    // 전공선택
  | 'general_required'  // 교양필수
  | 'general_elective'  // 교양선택
  | 'free_elective'     // 자유선택
  | 'teaching';         // 교직

/** Offered-semester keys, labelled 1학기 · 여름학기 · 2학기 · 겨울학기 by SEMESTER_LABELS. */
export type Semester = 'spring' | 'summer' | 'fall' | 'winter';

/** One entry of the dashboard's `adminMenus` const (six entries), rendered as a Link-wrapped menu Card. */
export interface AdminMenu {
  /** CardTitle text (text-lg), e.g. 과목 관리. */
  title: string;
  /** CardDescription text, e.g. 과목을 추가, 수정, 삭제합니다. */
  description: string;
  /** Link target under /admin, e.g. '/admin/courses'. */
  href: string;
}

/** `data.data` of GET /api/admin/stats?year=…; each count fills one stat Card (0 while undefined). */
export interface AdminStats {
  /** Shown in yu-navy under 공식 과목 ({selectedYear}). */
  courseCount: number;
  /** Shown in green-600 under 학과. */
  departmentCount: number;
  /** Shown in purple-600 under 사용자. */
  userCount: number;
  /** Shown in orange-600 under 수강 계획. */
  planCount: number;
}

/** Department reference embedded in a course row and listed in the 전체 학과 select. */
export interface DepartmentItem {
  _id: string;
  code: string;
  name: string;
}

/** One courses-page row (GET /api/courses). */
export interface CourseItem {
  _id: string;
  /** Bold slate-800 lead of the title line. */
  code: string;
  /** Medium slate-700 text after the code. */
  name: string;
  /** Rendered as the slate-100 `{credits}학점` badge. */
  credits: number;
  /** Optional; its name opens the slate-400 meta line and the 전체 학과 filter matches on `_id`. */
  department?: DepartmentItem;
  /** Joined with ', ' through SEMESTER_LABELS in the meta line. */
  semesters: Semester[];
  /** Optional; drives the colored category badge; absent → no badge. */
  category?: RequirementCategory;
  /** Optional; meta line `{recommendedYear}학년 권장`. */
  recommendedYear?: number;
  recommendedSemester?: Semester;
  description?: string;
  isActive: boolean;
}

/** One departments-page row (GET /api/departments). */
export interface Department {
  _id: string;
  /** blue-100 / blue-700 code pill. */
  code: string;
  /** Medium slate-900 name beside the pill. */
  name: string;
  /** Optional slate-400 caption under the name. */
  college?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** One users-page row (GET /api/admin/users). */
export interface UserItem {
  _id: string;
  /** Medium slate-900, truncated. */
  name: string;
  /** First item of the slate-400 meta line. */
  email: string;
  department?: { _id: string; code: string; name: string };
  /** Meta line `{enrollmentYear}학번` when set. */
  enrollmentYear?: number;
  /** purple-100 / purple-700 pill when set. */
  studentId?: string;
  /** 'admin' → red-100/red-700 pill with Shield; 'student' → blue-100/blue-700 pill with User. */
  role: 'student' | 'admin';
  /** 'google' → yellow-100/yellow-700 'Google' pill; 'credentials' → gray-100/gray-700 '이메일'. */
  provider: 'credentials' | 'google';
  lastLoginAt?: string;
  createdAt: string;
}

/** The page-level state the pattern reads; nothing is passed as props. */
export interface AdminListProps {
  /** Dashboard year select; default DEFAULT_CURRICULUM_YEAR (2026), options 2025 | 2026. */
  selectedYear: number;
  /** Dashboard counts; while undefined (query loading) each number is a slate-200 pulse bar. */
  stats?: AdminStats;
  /** Dashboard menu Cards; the `adminMenus` const. */
  menus: AdminMenu[];
  /** Search text; courses placeholder 과목명 또는 코드 검색, users 이름 또는 이메일 검색..., departments 학과명 또는 코드로 검색.... Default ''. Non-empty shows the clear X (courses, departments). */
  searchTerm: string;
  /** Courses and users: selected department `_id`, '' = 전체 학과. Default ''. */
  departmentFilter: string;
  /** Courses: '' = 전체 카테고리. Default ''. */
  categoryFilter: RequirementCategory | '';
  /** Courses: curriculum year, default 2026. */
  yearFilter: number;
  /** Users: '' = 전체 역할 | 'student' | 'admin'. Default ''. */
  roleFilter: '' | 'student' | 'admin';
  /** Users: 'recent' (최근 가입순, default) | 'lastLogin' (최근 접속순) | 'name' (이름순). */
  sortOption: 'recent' | 'lastLogin' | 'name';
  /** Rows of the current page. */
  items: CourseItem[] | Department[] | UserItem[];
  /** Courses: the row whose Trash2 button is swapped for the inline [삭제][취소] pair. Default null. */
  deletingId: string | null;
  /** Departments: opens the 학과 삭제 modal; users: swaps the 사용자 삭제 button for the warning + [취소][삭제 확인] pair. Default null. */
  deleteConfirmId: string | null;
  /** Users: the row whose detail panel is expanded. Default null. */
  expandedUserId: string | null;
  /** TanStack Query flags: isLoading → pulse tiles; error → red-50 banner; neither and no rows → empty box. */
  isLoading: boolean;
  error?: Error | null;
}

/** 전공핵심 · 전공필수 · 전공선택 · 교양필수 · 교양선택 · 자유선택 · 교직. */
export declare const CATEGORY_LABELS: Record<RequirementCategory, string>;
/** Tailwind pairs: red-100/red-700, orange-100/orange-700, blue-100/blue-700, green-100/green-700, teal-100/teal-700, gray-100/gray-700, purple-100/purple-700 (courses page map, not the planner aliases). */
export declare const CATEGORY_COLORS: Record<RequirementCategory, string>;
/** 1학기 · 여름학기 · 2학기 · 겨울학기. */
export declare const SEMESTER_LABELS: Record<Semester, string>;
/** The six dashboard menu entries. */
export declare const adminMenus: AdminMenu[];

// ----- FeedbackCard -----
// FeedbackCard — pattern inputs adapted from src/app/(dashboard)/help/feedback/page.tsx (MyFeedbackItem, page state) and src/app/(dashboard)/admin/feedback/page.tsx (FeedbackItem, FeedbackCategory, FeedbackStatus, CATEGORY_LABELS, CATEGORY_COLORS, STATUS_LABELS). Both pages inline the markup; no component or props interface exists in the source. Documentation only; not type-checked.

/** Category key of a feedback document; the user form always submits 'contact'. */
export type FeedbackCategory = 'bug' | 'feature' | 'data-error' | 'other' | 'contact';

/** Lifecycle of a feedback document: pending until an admin replies or presses 답변 없이 해결. */
export type FeedbackStatus = 'pending' | 'resolved';

/** One row of GET /api/feedback/my, as the user page types it (copied verbatim). */
export interface MyFeedbackItem {
  /** Mongo id; key of the item and target of DELETE /api/feedback/:id. */
  _id: string;
  /** Category key; the user page never displays it. */
  category: string;
  /** The user's text, rendered with whitespace-pre-wrap. */
  message: string;
  /** Picks the pill: 대기중 (yellow, Clock) or 해결됨 (green, CheckCircle). */
  status: 'pending' | 'resolved';
  /** Admin reply text; when present the item gets the green-400 rail, green-50/30 fill and the 관리자 답변 box. */
  adminReply?: string;
  /** ISO date of the reply, shown in slate-400 beside the 관리자 답변 pill when present. */
  adminReplyAt?: string;
  /** Whether the user has seen the reply; the page invalidates the unread count but does not render this. */
  isReadByUser: boolean;
  /** ISO date; formatted with toLocaleDateString('ko-KR', { year, month: 'short', day, hour: '2-digit', minute: '2-digit' }). */
  createdAt: string;
  /** ISO date; not rendered. */
  updatedAt: string;
}

/** One row of GET /api/feedback, as the admin page types it (copied verbatim). */
export interface FeedbackItem {
  /** Mongo id; key, PATCH and DELETE target. */
  _id: string;
  /** Drives the category pill (CATEGORY_LABELS / CATEGORY_COLORS). */
  category: FeedbackCategory;
  /** Body text; clamped to three lines with a 더보기 toggle when longer than 150 characters. */
  message: string;
  /** Submitter email for anonymous feedback; the meta line falls back to it, then to 익명. */
  email?: string;
  /** Populated submitter; the meta line prints `${name} (${email})` when present. */
  userId?: { _id: string; email: string; name: string };
  /** Drives the status pill and the toggle button label (답변 없이 해결 / 대기로 변경). */
  status: FeedbackStatus;
  /** ISO date printed last on the meta line. */
  createdAt: string;
  /** ISO date; not rendered. */
  updatedAt: string;
  /** When set, the green-50 reply box replaces the reply textarea. */
  adminReply?: string;
  /** ISO date shown beside the 관리자 답변 pill. */
  adminReplyAt?: string;
  /** Read flags kept for the unread badges; not rendered by this page. */
  isReadByAdmin: boolean;
  /** Read flags kept for the unread badges; not rendered by this page. */
  isReadByUser: boolean;
}

/** State the user-facing pattern (help/feedback/page.tsx) renders from; page state, not props. */
export interface FeedbackCardProps {
  /** Textarea value, sliced to 2000 characters in onChange; the submit button is disabled until content.trim().length >= 5. */
  content: string;
  /** True while POST /api/feedback runs: textarea disabled, button disabled with Loader2 + 전송 중.... */
  isPending: boolean;
  /** isAuthenticated && !isGuest; false swaps the form for the dashed 로그인하기 box and hides the 내 문의 내역 card. */
  showMyFeedback: boolean;
  /** True while GET /api/feedback/my loads: two h-24 pulse skeletons stand in for the list. */
  feedbackLoading: boolean;
  /** The user's items; undefined or empty renders 아직 문의 내역이 없습니다.. */
  myFeedbacks?: MyFeedbackItem[];
  /** True while DELETE /api/feedback/:id runs: every 문의 삭제 button fades to 50%. */
  isDeleting: boolean;
}

/** State one admin item (admin/feedback/page.tsx) renders from, per FeedbackItem. */
export interface AdminFeedbackItemProps {
  /** The row being rendered inside <Card className="overflow-hidden">. */
  item: FeedbackItem;
  /** expandedIds.has(item._id): full message and 접기 instead of line-clamp-3 and 더보기 (only when message.length > 150). */
  isExpanded: boolean;
  /** replyingId === item._id && replyContent.length > 0: reveals the counter, 취소 and 답변 및 해결 처리 row under the textarea. */
  isReplying: boolean;
  /** Reply draft, sliced to 2000; 답변 및 해결 처리 is disabled until replyContent.trim().length >= 1. */
  replyContent: string;
  /** True while PATCH { adminReply } runs: textarea and 취소 disabled, submit shows Loader2 + 전송 중.... */
  isSubmittingReply: boolean;
  /** True while DELETE runs: the 피드백 삭제 button fades to 50%. */
  isDeletingFeedback: boolean;
}

/** Korean label per category pill: 버그, 기능 요청, 데이터 오류, 기타, 문의. */
export declare const CATEGORY_LABELS: Record<FeedbackCategory, string>;

/** Tailwind pair per category pill: bug red-100/red-700, feature blue-100/blue-700, data-error orange-100/orange-700, other gray-100/gray-700, contact teal-100/teal-700. */
export declare const CATEGORY_COLORS: Record<FeedbackCategory, string>;

/** Status pill label: 대기중 / 해결됨. */
export declare const STATUS_LABELS: Record<FeedbackStatus, string>;

// ----- ProfileCard -----
/**
 * ProfileCard — documentation-only types for the profile-page PATTERN (banner, identity and settings Cards written
 * inline in src/app/(dashboard)/profile/page.tsx). No component exists in the source; these are the values the page's
 * JSX reads from the session, the user-profile query and the guest stores.
 */

/** MajorType from src/types — 'double' → 복수전공 (purple), 'minor' → 부전공 (orange), 'single' → no badge, no extra row. */
export type ProfileMajorType = 'single' | 'double' | 'minor';

/** Values behind the banner and the 기본 정보 read-only rows (signed-in branch). */
export interface ProfileIdentity {
  /** Display name; the avatar shows name.charAt(0).toUpperCase(), falling back to 'U' (and the name to 사용자). */
  name?: string;
  /** session.user.email, shown in the 이메일 row. */
  email: string;
  /** Primary department name; undefined renders 미설정 in gray-400 and hides the department badge. */
  departmentName?: string;
  /** Renders `${enrollmentYear}년` in the row and `${enrollmentYear}년 입학` as a badge; undefined → 미설정 / no badge. */
  enrollmentYear?: number;
  /** userProfile.curriculumYear || DEFAULT_CURRICULUM_YEAR (2026). */
  curriculumYear?: number;
  /** Drives the third badge, the extra 복수전공/부전공 row and the toggle pair. */
  majorType: ProfileMajorType;
  /** Name after 복수전공: / 부전공:; the row falls back to 학과 미설정. */
  secondaryDepartment?: { name: string };
}

/** Values behind the 계정 정보 Card. */
export interface ProfileAccount {
  /** session.user.image — present → Google 계정 (chrome icon), absent → 이메일 계정 (mail icon). */
  image?: string;
  /** session.user.role, rendered with text-transform: capitalize; default 'student'. */
  role?: 'student' | 'admin';
  /** Guest branch: 계정 유형 reads 게스트 모드 (amber-600) and 데이터 저장 reads 이 브라우저에만 저장 (gray-500). */
  isGuest: boolean;
}

/** Local UI state the page keeps. */
export interface ProfilePageState {
  /** Toggled by the ghost sm Button (pencil / x) in the 기본 정보 header; swaps the rows for the edit form. */
  isEditing: boolean;
  /** formData.majorType — the toggle pair's current value; 부전공 is disabled while this is 'double'. */
  majorTypeDraft: ProfileMajorType;
  /** Disables 회원 탈퇴 and swaps its label for 삭제 중... */
  isDeleting: boolean;
}

// ----- PatchNotes -----
/**
 * PatchNotes — documentation-only types for the 업데이트 소식 PATTERN: the student-facing list page
 * (src/app/(dashboard)/patch-notes/page.tsx) and detail page (src/app/(dashboard)/patch-notes/[id]/page.tsx).
 * No component exists in the source; both are Next.js page components without props that render
 * IPatchNoteResponse rows fetched from /api/patch-notes. Data types are copied from src/types/index.ts.
 */

/** Publication state kept by the admin; the student pages only ever receive 'published' rows and never render it. */
export type PatchNoteStatus = 'draft' | 'published';

/** One announcement as the API returns it (src/types/index.ts). */
export interface IPatchNoteResponse {
  /** MongoDB id; the list links each row to /patch-notes/{_id}. */
  _id: string;
  /** Row title (truncate) and detail <h1>. */
  title: string;
  /** Body text; the list shows truncate(content, 100) + '...', the detail renders it whitespace-pre-wrap. */
  content: string;
  /** Optional version label; the blue-100 / blue-700 pill renders only when set. */
  version?: string;
  /** Draft or published — not rendered by either page. */
  status: PatchNoteStatus;
  /** ISO date shown through formatDate when present. */
  publishedAt?: string;
  /** Author reference — not rendered by either page. */
  createdBy?: { _id: string; name: string; email: string };
  /** ISO date; the date fallback when publishedAt is missing. */
  createdAt: string;
  /** ISO date — not rendered. */
  updatedAt: string;
}

/** Envelope both query functions expect from the API. */
export interface PatchNotesApiResponse<T = IPatchNoteResponse | IPatchNoteResponse[]> {
  /** True on success; the detail page posts the read receipt only when it is true. */
  success: boolean;
  /** One note (detail) or the list of notes. */
  data: T;
}

/** Which of the two pages a block of the pattern belongs to. */
export type PatchNotesView = 'list' | 'detail';

/** The branch each page renders: skeleton, red banner, slate empty box (list only) or the data. */
export type PatchNotesState = 'loading' | 'error' | 'empty' | 'ready';

/** Props of the pattern as the stylesheet models it (the pages themselves take none). */
export interface PatchNotesProps {
  /** 'list' renders the header and Card rows; 'detail' the back link and the single Card. */
  view: PatchNotesView;
  /** Which branch to show; 'empty' exists only for the list. Default 'ready'. */
  state?: PatchNotesState;
  /** Rows for the list view, in API order; each row is a Link around a Card. */
  notes?: IPatchNoteResponse[];
  /** The one announcement for the detail view, fetched by the [id] route param. */
  note?: IPatchNoteResponse;
}

/** Date formatter both pages use: toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) → 2026년 10월 15일. */
export type PatchNotesFormatDate = (iso: string) => string;

/** List excerpt helper: returns text unchanged when its length is at most max (default 100), else the first max characters plus '...'. */
export type PatchNotesTruncate = (text: string, max?: number) => string;

// ----- ModalShell -----
/**
 * ModalShell — documentation-only types for the modal-shell PATTERN: the overlay + panel markup the app
 * repeats inline around six dialogs. No shell component exists in the source; these are the props of the
 * three components that render one, the page state the admin and calendar pages key theirs on, and the
 * recipe names the stylesheet uses.
 */

/** Which source recipe a shell follows (one .cp-modal__panel--* modifier each). */
export type ModalShellRecipe =
  | 'custom-course'   // CustomCourseForm.tsx — rounded-lg shadow-xl max-w-md, p-4 gutter
  | 'add-semester'    // AddSemesterDialog.tsx — Card panel, max-w-md, no gutter
  | 'all-plans'       // AllPlansModal.tsx — rounded-xl shadow-2xl max-w-4xl, gray-50 bands, z-40
  | 'admin-form'      // admin/courses + admin/departments — rounded-2xl p-6 shadow-xl max-w-lg
  | 'admin-confirm'   // admin/departments — rounded-2xl p-6 shadow-xl max-w-sm
  | 'calendar-event'; // calendar/page.tsx — Card panel, max-w-lg, opaque overlay

/** Overlay fill: bg-black/50 with or without the p-4 gutter, or the calendar's v3 `bg-black bg-opacity-50` that compiles to solid black under Tailwind v4. */
export type ModalOverlayRecipe = 'black-a50' | 'black-a50-gutter' | 'opaque-black';

/** The contract every shell shares, as the pages use it (not an interface in the source). */
export interface ModalShellProps {
  /** Source recipe; picks the panel's radius, shadow, max-width and header/footer layout. */
  recipe: ModalShellRecipe;
  /** Closes the dialog; (b) and (c) also call it on backdrop click and Escape. */
  onClose: () => void;
  /** Header text: `커스텀 과목 추가`, `학기 추가`, `익명 수강계획 전체 보기`, `과목 추가`/`과목 수정`, `학과 삭제`, `일정 추가`/`일정 수정`. */
  title: string;
  /** Optional body-sm gray-500 line under the title; only (a) and (c) render one. */
  subtitle?: string;
  /** Whether the header carries the hand-rolled X button; true for (c), (d courses) and (e) only. */
  closeButton?: boolean;
  /** The inner form, list or confirm text and its action row — the shell's children. */
  children?: React.ReactNode;
}

/** src/components/features/CustomCourseForm.tsx — mounted by the parent only while open. */
export interface CustomCourseFormProps {
  /** Closes the modal after a successful create or on 취소. */
  onClose: () => void;
  /** Department the custom course is created under; submit is disabled without it. */
  departmentId?: string;
  /** Restricts the 이수구분 select; defaults to every RequirementCategory. */
  availableCategories?: RequirementCategory[];
  /** Semester the new course is auto-added to; submit is disabled while null. */
  focusedSemester?: { year: number; term: string } | null;
  /** Called with the created course so the planner can place it in the focused semester. */
  onClickAdd?: (
    courseId: string,
    courseData: { code: string; name: string; credits: number; category?: RequirementCategory; departmentId?: string }
  ) => void;
}

/** src/components/features/AddSemesterDialog.tsx */
export interface AddSemesterDialogProps {
  /** Renders nothing while false; recomputes the year/term defaults when it turns true. */
  isOpen: boolean;
  /** Called on 취소, backdrop click and Escape. */
  onClose: () => void;
  /** Called on submit with the chosen grade year and term. */
  onAdd: (year: number, term: Term) => void;
  /** Existing semesters, used for the smart default and the duplicate warning. */
  existingSemesters: Array<{ year: number; term: Term }>;
  /** Disables every control and shows the Button spinner (default false). */
  isLoading?: boolean;
}

/** src/components/features/AllPlansModal.tsx */
export interface AllPlansModalProps {
  /** Renders nothing while false; locks body scroll and focuses the panel while true. */
  isOpen: boolean;
  /** Called on the 닫기 button, backdrop click and Escape (unless a detail modal is open). */
  onClose: () => void;
  /** Department whose anonymous plans are listed. */
  departmentId?: string;
}

/** Page state the admin and calendar shells are keyed on (no props; each page owns the modal). */
export interface InlineModalPageState {
  /** admin/courses, admin/departments: the create/edit form modal is open. */
  showForm: boolean;
  /** admin/departments: the delete confirm is open for this id. */
  deleteConfirmId: string | null;
  /** calendar: the event form modal is open. */
  showEventForm: boolean;
  /** admin pages: disables the submit button and swaps its label to 저장 중.... */
  isSaving: boolean;
}

/** Re-exported from src/types for the signatures above. */
export type RequirementCategory =
  | 'major_required'
  | 'major_compulsory'
  | 'major_elective'
  | 'general_required'
  | 'general_elective'
  | 'teaching'
  | 'free_elective';

/** Semester term as AddSemesterDialog uses it. */
export type Term = 'spring' | 'fall';

