'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { QueryCache, QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';

import { usePathname } from 'next/navigation';
import { usePlanStore } from '@/stores/planStore';
import { useToastStore } from '@/stores/toastStore';

function SessionCacheGuard() {
  const { data: session, status } = useSession();
  const client = useQueryClient();
  const pathname = usePathname();
  const previous = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (status === 'loading') return;
    const current = session?.user?.id ?? null;
    if ((previous.current !== undefined && previous.current !== current) ||
        (status === 'unauthenticated' && (pathname === '/login' || pathname === '/register'))) {
      client.clear();
      usePlanStore.setState(usePlanStore.getInitialState());
      useToastStore.setState({ toasts: [] });
    }
    previous.current = current;
  }, [session?.user?.id, status, client, pathname]);
  return null;
}

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            const onError = query.meta?.onError;
            if (typeof onError === 'function') onError(error);
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute - default for dynamic data
            refetchOnWindowFocus: false, // Prevent unnecessary refetches on focus
            gcTime: 5 * 60 * 1000, // 5 minutes - cache cleanup time
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <SessionCacheGuard />
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
}
