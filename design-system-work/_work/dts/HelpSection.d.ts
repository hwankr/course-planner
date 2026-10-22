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
