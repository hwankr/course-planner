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
