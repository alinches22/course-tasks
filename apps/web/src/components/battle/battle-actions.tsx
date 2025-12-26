'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation } from 'urql';
import { SUBMIT_ACTION } from '@/lib/graphql/operations/battles';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils/cn';

interface BattleActionsProps {
  battleId: string;
  isActive: boolean;
  currentPrice: number;
  position?: string;
}

export function BattleActions({ battleId, isActive, currentPrice, position = 'FLAT' }: BattleActionsProps) {
  const { addToast } = useToast();
  const [, submitAction] = useMutation(SUBMIT_ACTION);
  const [isSubmitting, setIsSubmitting] = useState<'BUY' | 'SELL' | 'CLOSE' | null>(null);

  const handleAction = async (type: 'BUY' | 'SELL' | 'CLOSE') => {
    if (!isActive || isSubmitting) return;

    setIsSubmitting(type);
    try {
      const result = await submitAction({
        input: {
          battleId,
          type,
          quantity: 1, // Fixed quantity for simplicity
        },
      });

      if (result.error) throw new Error(result.error.message);
      
      const actionLabel = type === 'CLOSE' ? 'Position closed' : `${type} order executed`;
      addToast('success', `${actionLabel} at $${currentPrice.toFixed(2)}`);
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Failed to submit action');
    } finally {
      setIsSubmitting(null);
    }
  };

  const hasPosition = position !== 'FLAT';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <motion.div whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => handleAction('BUY')}
            disabled={!isActive || isSubmitting !== null}
            isLoading={isSubmitting === 'BUY'}
            className={cn(
              'w-full h-16 text-lg font-bold',
              'bg-accent-green hover:bg-accent-green/90 glow-green'
            )}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            BUY
          </Button>
        </motion.div>

        <motion.div whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => handleAction('SELL')}
            disabled={!isActive || isSubmitting !== null}
            isLoading={isSubmitting === 'SELL'}
            className={cn(
              'w-full h-16 text-lg font-bold',
              'bg-accent-red hover:bg-accent-red/90 glow-red'
            )}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            SELL
          </Button>
        </motion.div>
      </div>

      {/* Close position button */}
      {hasPosition && (
        <motion.div whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => handleAction('CLOSE')}
            disabled={!isActive || isSubmitting !== null}
            isLoading={isSubmitting === 'CLOSE'}
            variant="outline"
            className="w-full"
          >
            Close Position ({position})
          </Button>
        </motion.div>
      )}

      {!isActive && (
        <p className="text-center text-sm text-text-muted">
          {position !== 'FLAT' ? `Position: ${position}` : 'Waiting for battle to start...'}
        </p>
      )}
    </div>
  );
}
