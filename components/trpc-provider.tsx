'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';

function getBaseUrl() {
  // Use direct TRPC URL if available
  if (process.env.NEXT_PUBLIC_TRPC_URL) return process.env.NEXT_PUBLIC_TRPC_URL;
  
  // Fallback to API URL + /api/trpc
  if (process.env.NEXT_PUBLIC_API_URL) return `${process.env.NEXT_PUBLIC_API_URL}/api/trpc`;
  
  // Development fallback
  return 'http://localhost:3001/api/trpc';
}

export default function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: getBaseUrl(),
          fetch(url, options) {
            return fetch(url, {
              ...options,
              // Increase timeout to 30 seconds
              signal: AbortSignal.timeout(30000),
            });
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}