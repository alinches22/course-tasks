'use client';

import { useCallback, useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { useMutation, useQuery } from 'urql';
import { useAuthStore } from '@/stores/auth.store';
import { GET_NONCE, VERIFY_SIGNATURE, GET_ME } from '@/lib/graphql/operations/auth';

export function useAuth() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { token, user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const [, getNonce] = useMutation(GET_NONCE);
  const [, verifySignature] = useMutation(VERIFY_SIGNATURE);

  const [{ data: meData }] = useQuery({
    query: GET_ME,
    pause: !token,
  });

  const signIn = useCallback(async () => {
    if (!address) return;

    setIsSigningIn(true);
    try {
      // Get nonce
      const nonceResult = await getNonce({ address });
      if (nonceResult.error || !nonceResult.data?.getNonce) {
        throw new Error('Failed to get nonce');
      }

      const { message } = nonceResult.data.getNonce;

      // Sign message
      const signature = await signMessageAsync({ message });

      // Verify signature
      const verifyResult = await verifySignature({
        input: { address, signature },
      });

      if (verifyResult.error || !verifyResult.data?.verifySignature) {
        throw new Error('Failed to verify signature');
      }

      const { token: newToken, user: newUser } = verifyResult.data.verifySignature;
      setAuth(newToken, newUser);
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  }, [address, getNonce, signMessageAsync, verifySignature, setAuth]);

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
