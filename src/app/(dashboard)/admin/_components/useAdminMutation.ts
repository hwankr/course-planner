'use client';

import { useRef, useState } from 'react';
import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

/** A new form opening owns a new session, even when it edits the same entity. */
export function createFormSession() {
  let current = 0;
  let pending = false;
  return {
    begin: () => ++current,
    capture: () => current,
    isCurrent: (id: number | undefined) => id === current,
    isPending: () => pending,
    tryLock: () => { if (pending) return false; pending = true; return true; },
    unlock: () => { pending = false; },
  };
}
export function useAdminFormSession() {
  const [session] = useState(createFormSession);
  return session;
}

/** Lock synchronously so two clicks in the same render cannot issue duplicate writes. */
export function useAdminMutation<TData, TVariables>(
  options: Omit<UseMutationOptions<TData, Error, TVariables, number>, 'onMutate'>,
  session: ReturnType<typeof createFormSession>,
) {
  const locked = useRef<number | null>(null);
  const mutation = useMutation({
    ...options,
    onMutate: () => locked.current ?? session.capture(),
    onSettled: async (...args) => {
      try { await options.onSettled?.(...args); }
      finally { locked.current = null; session.unlock(); }
    },
  });
  return {
    ...mutation,
    mutate: (variables: TVariables) => {
      if (locked.current !== null || !session.tryLock()) return;
      locked.current = session.capture();
      mutation.mutate(variables);
    },
  };
}
