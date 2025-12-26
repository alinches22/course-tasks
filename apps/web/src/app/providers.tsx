'use client';

import { useState, useEffect } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as UrqlProvider } from 'urql';
import { wagmiConfig } from '@/lib/wagmi/config';
import { createGraphQLClient } from '@/lib/graphql/client';
import { ToastProvider } from '@/components/ui/toast';
import { useAuthStore } from '@/stores/auth.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function UrqlWrapper({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  const [client, setClient] = useState(() => createGraphQLClient(token));

  useEffect(() => {
    setClient(createGraphQLClient(token));
  }, [token]);

  return <UrqlProvider value={client}>{children}</UrqlProvider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <UrqlWrapper>
          <ToastProvider>{children}</ToastProvider>
        </UrqlWrapper>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
