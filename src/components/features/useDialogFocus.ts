import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** 가장 위에 열린 aria-modal 안에 있을 때만 키 입력을 처리한다 (중첩 모달 대비) */
function isTopmostDialog(container: HTMLElement) {
  const own = container.closest('[aria-modal="true"]');
  if (!own) return true;
  const modals = document.querySelectorAll('[aria-modal="true"]');
  return modals[modals.length - 1] === own;
}

/**
 * 모달 포커스 관리: 열릴 때 첫 포커스, Tab 순환, (선택) Escape 닫기, 닫힐 때 트리거로 복귀.
 * Escape를 처리하면 preventDefault 하므로 바깥 Escape 핸들러는 defaultPrevented를 보고 건너뛸 수 있다.
 */
export function useDialogFocus(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
  { initialFocus = 'first', onEscape }: { initialFocus?: 'first' | 'container'; onEscape?: () => void } = {}
) {
  const onEscapeRef = useRef(onEscape);
  useEffect(() => {
    onEscapeRef.current = onEscape;
  });

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const getFocusables = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.getClientRects().length > 0
      );

    if (!container.hasAttribute('tabindex')) container.tabIndex = -1;
    (initialFocus === 'first' ? getFocusables()[0] ?? container : container).focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isTopmostDialog(container)) return;
      if (e.key === 'Escape' && onEscapeRef.current) {
        e.preventDefault();
        onEscapeRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = getFocusables();
      if (items.length === 0) {
        e.preventDefault();
        container.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      if (e.shiftKey && (current === first || current === container || !container.contains(current))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (current === last || !container.contains(current))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (trigger?.isConnected && trigger !== document.body) trigger.focus();
    };
  }, [active, containerRef, initialFocus]);
}
