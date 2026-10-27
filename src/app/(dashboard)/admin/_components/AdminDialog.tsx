'use client';

import { useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui';
import { useDialogFocus } from '@/components/features/useDialogFocus';
import { cn } from '@/lib/utils';

export function AdminDialog({ title, onClose, children, wide = false, pending = false, isPending }: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  pending?: boolean;
  isPending?: () => boolean;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const requestClose = () => { if (!pending && !isPending?.()) onClose(); };
  useDialogFocus(dialogRef, true, { onEscape: requestClose });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={requestClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-busy={pending}
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className={cn('max-h-[90dvh] w-full overflow-y-auto rounded-none border border-line-2 bg-white p-5 shadow-float md:p-6', wide ? 'max-w-4xl' : 'max-w-lg')}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-[18px] leading-[26px] font-bold tracking-[-0.02em] text-ink">{title}</h2>
          <Button type="button" variant="text" size="icon" onClick={requestClose} disabled={pending} aria-label="닫기" className="shrink-0">
            <X aria-hidden="true" className="h-5 w-5" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function AdminConfirmDialog({ title, description, onClose, onConfirm, pending, isPending, confirmLabel = '삭제', danger = true }: {
  title: string;
  description: ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  pending?: boolean;
  isPending?: () => boolean;
  confirmLabel?: string;
  danger?: boolean;
}) {
  return (
    <AdminDialog title={title} onClose={onClose} pending={pending} isPending={isPending}>
      <p className="text-[14px] leading-6 text-ink-2">{description}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="text" disabled={pending} onClick={() => { if (!pending && !isPending?.()) onClose(); }}>취소</Button>
        <Button type="button" variant={danger ? 'textDanger' : 'outline'} disabled={pending} onClick={() => { if (!pending && !isPending?.()) onConfirm(); }}>
          {pending ? '처리 중…' : confirmLabel}
        </Button>
      </div>
    </AdminDialog>
  );
}
