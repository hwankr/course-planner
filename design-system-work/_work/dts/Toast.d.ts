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
