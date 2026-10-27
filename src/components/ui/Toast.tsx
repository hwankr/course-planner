'use client';

import { useToastStore } from '@/stores/toastStore';

// 떠 있는 요소이므로 허용된 그림자 하나(shadow-float)만 쓴다. 상태는 글자색으로만.
const typeStyles = {
  success: {
    actionText: 'text-positive hover:text-positive/80',
  },
  info: {
    actionText: 'text-primary hover:text-primary-hover',
  },
  warning: {
    actionText: 'text-negative hover:text-negative-hover',
  },
};

export function Toast() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-[100px] md:bottom-6 inset-x-0 z-50 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col-reverse gap-2 mx-5 sm:mx-auto sm:max-w-sm">
        {toasts.map((toast) => {
          const styles = typeStyles[toast.type];
          return (
            <div
              key={toast.id}
              className="pointer-events-auto bg-white rounded-none shadow-float border border-line-2 px-4 py-3 animate-fade-in"
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] leading-5 font-semibold text-ink truncate">
                    {toast.message}
                  </div>
                  {toast.graduationDelta ? (
                    <div className="mt-1 space-y-1">
                      {toast.graduationDelta.categoryPct && (
                        <div className="flex items-center gap-1.5 text-[12px] leading-4">
                          <span className="text-ink-2 w-7 flex-shrink-0">
                            {toast.graduationDelta.categoryLabel.startsWith('전공') ? '전공' : '교양'}
                          </span>
                          <div className="flex-1 h-1.5 bg-line rounded-[3px] overflow-hidden relative">
                            <div
                              className="h-full bg-primary/45 absolute inset-y-0 left-0"
                              style={{ width: `${toast.graduationDelta.categoryPct.after}%` }}
                            />
                            <div
                              className="h-full bg-primary relative"
                              style={{ width: `${toast.graduationDelta.categoryPct.before}%` }}
                            />
                          </div>
                          <span className="text-ink font-semibold tabular-nums text-[12px] w-16 text-right flex-shrink-0">
                            {toast.graduationDelta.categoryCredits ? `${toast.graduationDelta.categoryCredits.after}/${toast.graduationDelta.categoryCredits.required}` : `${toast.graduationDelta.categoryPct.before}→${toast.graduationDelta.categoryPct.after}%`}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-[12px] leading-4">
                        <span className="text-ink-2 w-auto flex-shrink-0">{toast.graduationDelta.secondRowLabel}</span>
                        <div className="flex-1 h-1.5 bg-line rounded-[3px] overflow-hidden relative">
                          <div
                            className="h-full bg-primary/45 absolute inset-y-0 left-0"
                            style={{ width: `${toast.graduationDelta.secondRowPct.after}%` }}
                          />
                          <div
                            className="h-full bg-primary relative"
                            style={{ width: `${toast.graduationDelta.secondRowPct.before}%` }}
                          />
                        </div>
                        <span className="text-ink font-semibold tabular-nums text-[12px] w-16 text-right flex-shrink-0">
                          {toast.graduationDelta.secondRowCredits ? `${toast.graduationDelta.secondRowCredits.after}/${toast.graduationDelta.secondRowCredits.required}` : `${toast.graduationDelta.secondRowPct.before}→${toast.graduationDelta.secondRowPct.after}%`}
                        </span>
                      </div>
                    </div>
                  ) : toast.description ? (
                    <div className="text-[13px] leading-[18px] text-ink-2 mt-0.5">
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
                      className={`text-[13px] font-semibold px-2 min-h-[32px] rounded-[8px] transition-colors duration-150 ${styles.actionText}`}
                    >
                      {toast.action.label}
                    </button>
                  )}
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="p-1.5 -m-1 text-placeholder hover:text-ink transition-colors duration-150"
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
