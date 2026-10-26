/**
 * HelpSection — documentation-only types for the help-article PATTERN (src/app/(dashboard)/help/page.tsx and
 * src/app/(dashboard)/help/graduation-guide/page.tsx). No component exists; the help page writes its sections inline
 * and the guide maps over the FlowStep data below (copied from the guide source).
 */

import type { Search, BookOpen } from 'lucide-react';

/** Icon tile tint used by section headings: navy = bg-[#153974]/10, blue = bg-[#3069B3]/10, cyan = bg-[#00AACA]/10, purple = bg-purple-100. */
export type HelpTileTint = 'navy' | 'blue' | 'cyan' | 'purple';

/** The data the graduation guide renders (module-level constants in graduation-guide/page.tsx, not props of a component). */
export interface HelpSectionProps {
  /** The two-pane STEP sections, in order (const flowSections: FlowStep[]). */
  flowSections: FlowStep[];
  /** The STEP 3 audit boxes, in order (const auditCheckItems, untyped in the source). */
  auditCheckItems: AuditCheckItem[];
}

/** One step section of the graduation guide (interface FlowStep in graduation-guide/page.tsx). */
export interface FlowStep {
  /** Stable React key, e.g. 'homepage-portal'. */
  id: string;
  /** Text-only eyebrow pill above the heading, e.g. 'STEP 1'. */
  badge: string;
  /** h2 text beside the icon tile; also builds the zoom button's aria-label "{title} 이미지 확대 보기". */
  title: string;
  /** Paragraph under the title; empty in the source, which still renders an empty <p> whose mt-3 collapses into the list's mt-4. */
  description: string;
  /** Rows of the ordered list, numbered in yu-navy circles. */
  steps: string[];
  /** Screenshot shown in the media pane and the lightbox. */
  imageSrc: string;
  /** Alt text of the pane image and the lightbox image. */
  imageAlt: string;
  /** Text of the white strip under the image; empty in the source, which leaves a 25px empty strip (1px top rule + 2×12px padding). */
  imageCaption: string;
  /** Intrinsic width passed to the lightbox's next/image. */
  imageWidth: number;
  /** Intrinsic height passed to the lightbox's next/image. */
  imageHeight: number;
  /** Lucide component rendered in the tile at h-5 w-5. */
  icon: typeof Search | typeof BookOpen;
  /** Tailwind text color class for the icon, e.g. 'text-[#153974]'. */
  iconColorClass: string;
  /** Tailwind background class for the tile, e.g. 'bg-[#153974]/10'. */
  iconBgClass: string;
}

/** One audit box (items of auditCheckItems in graduation-guide/page.tsx). */
export interface AuditCheckItem {
  /** h3 text in yu-navy, e.g. '졸업기준 학점'. */
  title: string;
  /** One-sentence explanation under the title in slate-600. */
  description: string;
}

/** The guide's lightbox state (interface ZoomImage); null when closed. Escape or a backdrop pointerdown/click closes it; body scroll is locked while open. */
export interface ZoomImage {
  /** Image URL shown in the lightbox. */
  src: string;
  /** Alt text of the lightbox image. */
  alt: string;
  /** Intrinsic width for next/image. */
  width: number;
  /** Intrinsic height for next/image. */
  height: number;
}
