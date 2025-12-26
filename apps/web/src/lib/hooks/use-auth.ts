'use client';

import { useCallback, useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { useMutation, useQuery, useClient } from 'urql';
import { useAuthStore } from '@/stores/auth.store';
import { GET_NONCE, VERIFY_SIGNATURE, GET_ME } from '@/lib/graphql/operations/auth';

export function useAuth() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { token, user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const client = useClient();
  const [, verifySignature] = useMutation(VERIFY_SIGNATURE);

  const [{ data: meData }] = useQuery({
    query: GET_ME,
    pause: !token,
  });

  const signIn = useCallback(async () => {
    if (!address) return;

    setIsSigningIn(true);
    try {
      // Get nonce (using query, not mutation)
      const nonceResult = await client.query(GET_NONCE, { address }).toPromise();
      if (nonceResult.error || !nonceResult.data?.getNonce) {
        throw new Error(nonceResult.error?.message || 'Failed to get nonce');
      }

      const { message } = nonceResult.data.getNonce;

      // Sign message with wallet
      const signature = await signMessageAsync({ message });

      // Verify signature and get JWT
      const verifyResult = await verifySignature({
        input: { address, signature },
      });

      if (verifyResult.error || !verifyResult.data?.verifySignature) {
        throw new Error(verifyResult.error?.message || 'Failed to verify signature');
      }

      const { token: newToken, user: newUser } = verifyResult.data.verifySignature;
      setAuth(newToken, newUser);
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  }, [address, client, signMessageAsync, verifySignature, setAuth]);

  const signOut = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  return {
    token,
    user: meData?.me || user,
    isAuthenticated,
    isSigningIn,
    signIn,
    signOut,
  };
}
