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
