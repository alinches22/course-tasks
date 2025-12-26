'use client';

import { cacheExchange, createClient, fetchExchange, subscriptionExchange } from 'urql';
import { createClient as createWSClient } from 'graphql-ws';
import { API_CONFIG } from '../constants/config';

let wsClient: ReturnType<typeof createWSClient> | null = null;

function getWsClient(token?: string | null) {
  if (typeof window === 'undefined') return null;

  // Close existing connection if token changes
  if (wsClient) {
    wsClient.dispose();
  }

  wsClient = createWSClient({
    url: API_CONFIG.wsUrl,
    connectionParams: () => ({
      authorization: token ? `Bearer ${token}` : undefined,
    }),
    shouldRetry: () => true,
    retryAttempts: 5,
    retryWait: async (retries) => {
      await new Promise((resolve) => setTimeout(resolve, Math.min(1000 * 2 ** retries, 30000)));
    },
    keepAlive: 15000, // 15s ping/pong
    on: {
      connected: () => console.log('[WS] Connected'),
      closed: () => console.log('[WS] Closed'),
      error: (error) => console.error('[WS] Error:', error),
    },
  });

  return wsClient;
}

export function createGraphQLClient(token?: string | null) {
  const wsClientInstance = getWsClient(token);

  return createClient({
    url: `${API_CONFIG.url}${API_CONFIG.graphqlPath}`,
    exchanges: [
      cacheExchange,
      fetchExchange,
      ...(wsClientInstance
        ? [
            subscriptionExchange({
              forwardSubscription(request) {
                const input = { ...request, query: request.query || '' };
                return {
                  subscribe(sink) {
                    const unsubscribe = wsClientInstance.subscribe(input, sink);
                    return { unsubscribe };
                  },
                };
              },
            }),
          ]
        : []),
    ],
    fetchOptions: () => ({
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }),
  });
}

export function disposeWsClient() {
  if (wsClient) {
    wsClient.dispose();
    wsClient = null;
  }
}
