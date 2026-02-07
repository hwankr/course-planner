import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  description?: string;
  graduationDelta?: {
    creditsDelta: number;
    categoryLabel: string;
    categoryPct?: { before: number; after: number };
    totalPct: { before: number; after: number };
  };
  type: 'success' | 'info' | 'warning';
  action?: { label: string; onClick: () => void };
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = crypto.randomUUID();
    const duration = toast.duration ?? 5000;

    set((state) => {
      // Cap at 3 toasts, drop oldest
      const newToasts = [...state.toasts, { ...toast, id }];
      if (newToasts.length > 3) {
        return { toasts: newToasts.slice(-3) };
      }
      return { toasts: newToasts };
    });

    // Auto-dismiss
    setTimeout(() => {
      get().removeToast(id);
    }, duration);

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
