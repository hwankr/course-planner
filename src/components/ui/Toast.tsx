'use client';

import { useToastStore } from '@/stores/toastStore';

const typeStyles = {
  success: {
    border: 'border-l-green-500',
    actionText: 'text-green-600 hover:text-green-700',
  },
  info: {
    border: 'border-l-blue-500',
    actionText: 'text-blue-600 hover:text-blue-700',
  },
  warning: {
    border: 'border-l-amber-500',
    actionText: 'text-amber-600 hover:text-amber-700',
  },
};

export function Toast() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 inset-x-0 z-50 pointer-events-none">
      <div className="flex flex-col-reverse gap-2 mx-3 sm:mx-auto sm:max-w-sm">
        {toasts.map((toast) => {
          const styles = typeStyles[toast.type];
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto bg-white rounded-lg shadow-lg border border-gray-200 border-l-4 ${styles.border} p-3 animate-fade-in-up`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {toast.message}
                  </p>
                  {toast.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {toast.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {toast.action && (
                    <button
                      onClick={() => {
                        toast.action!.onClick();
                        removeToast(toast.id);
                      }}
                      className={`text-xs font-medium px-2 py-1 rounded-md hover:bg-gray-50 transition-colors ${styles.actionText}`}
                    >
                      {toast.action.label}
                    </button>
                  )}
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="닫기"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
