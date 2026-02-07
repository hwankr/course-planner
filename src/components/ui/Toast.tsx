'use client';

import { useToastStore } from '@/stores/toastStore';

const typeStyles = {
  success: {
    border: 'border-l-green-500',
    actionText: 'text-green-600 hover:text-green-700',
  },
  info: {
    border: 'border-l-[#3069B3]',
    actionText: 'text-[#153974] hover:text-[#003E7E]',
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
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {toast.message}
                  </div>
                  {toast.graduationDelta ? (
                    <div className="mt-1 space-y-1">
                      {toast.graduationDelta.categoryPct && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-gray-500 w-7 flex-shrink-0">
                            {toast.graduationDelta.categoryLabel.startsWith('전공') ? '전공' : '교양'}
                          </span>
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden relative">
                            <div
                              className="h-full bg-[#3069B3]/40 rounded-full absolute inset-y-0 left-0"
                              style={{ width: `${toast.graduationDelta.categoryPct.after}%` }}
                            />
                            <div
                              className="h-full bg-[#3069B3] rounded-full relative"
                              style={{ width: `${toast.graduationDelta.categoryPct.before}%` }}
                            />
                          </div>
                          <span className="text-gray-400 text-[10px] w-16 text-right flex-shrink-0">
                            {toast.graduationDelta.categoryCredits ? `${toast.graduationDelta.categoryCredits.after}/${toast.graduationDelta.categoryCredits.required}` : `${toast.graduationDelta.categoryPct.before}→${toast.graduationDelta.categoryPct.after}%`}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-gray-500 w-auto flex-shrink-0">{toast.graduationDelta.secondRowLabel}</span>
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden relative">
                          <div
                            className="h-full bg-green-300 rounded-full absolute inset-y-0 left-0"
                            style={{ width: `${toast.graduationDelta.secondRowPct.after}%` }}
                          />
                          <div
                            className="h-full bg-green-500 rounded-full relative"
                            style={{ width: `${toast.graduationDelta.secondRowPct.before}%` }}
                          />
                        </div>
                        <span className="text-gray-400 text-[10px] w-16 text-right flex-shrink-0">
                          {toast.graduationDelta.secondRowCredits ? `${toast.graduationDelta.secondRowCredits.after}/${toast.graduationDelta.secondRowCredits.required}` : `${toast.graduationDelta.secondRowPct.before}→${toast.graduationDelta.secondRowPct.after}%`}
                        </span>
                      </div>
                    </div>
                  ) : toast.description ? (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {toast.description}
                    </div>
                  ) : null}
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
