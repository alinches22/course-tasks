'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSubscription as useUrqlSubscription } from 'urql';

/**
 * Custom hook for handling GraphQL subscriptions with reconnection logic
 */
export function useReconnectingSubscription<TData, TVariables extends object>(
  query: any,
  variables: TVariables,
  options: {
    pause?: boolean;
    onData?: (data: TData) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const { pause, onData, onError } = options;
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const [result, reexecute] = useUrqlSubscription<TData>(
    {
      query,
      variables,
      pause,
    }
  );

  // Handle data updates
  useEffect(() => {
    if (result.data && onData) {
      onData(result.data);
      reconnectAttempts.current = 0; // Reset on successful data
    }
  }, [result.data, onData]);

  // Handle errors with reconnection
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (result.error) {
      if (onError) {
        onError(result.error);
      }

      // Attempt reconnection
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        console.log(`[Subscription] Reconnecting in ${timeout}ms (attempt ${reconnectAttempts.current + 1})`);
        
        timer = setTimeout(() => {
          reconnectAttempts.current++;
          reexecute();
        }, timeout);
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [result.error, onError, reexecute]);

  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0;
    reexecute();
  }, [reexecute]);

  return {
    data: result.data,
    error: result.error,
    fetching: result.fetching,
    reconnect,
  };
}
