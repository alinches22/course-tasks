'use client';

import { motion } from 'framer-motion';
import { formatAddress, formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface Action {
  userId: string;
  type: 'BUY' | 'SELL' | 'CLOSE';
  quantity: number;
  price: number;
  tickIndex: number;
  serverTs: string;
}

interface Participant {
  userId: string;
  address: string;
  side: 'A' | 'B';
}

interface ReplayActionsListProps {
  actions: Action[];
  participants: Participant[];
  currentIndex: number;
}

export function ReplayActionsList({ actions, participants, currentIndex }: ReplayActionsListProps) {
  const getParticipant = (userId: string) => participants.find((p) => p.userId === userId);

  const visibleActions = actions.filter((a) => a.tickIndex <= currentIndex);

  return (
    <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-hide">
      {visibleActions.length === 0 ? (
        <p className="text-center text-text-muted py-4">No actions yet</p>
      ) : (
        visibleActions.map((action, index) => {
          const participant = getParticipant(action.userId);
          const isNew = action.tickIndex === currentIndex;

          return (
            <motion.div
              key={`${action.userId}-${action.tickIndex}-${index}`}
              initial={isNew ? { opacity: 0, x: -10 } : false}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg',
                action.type === 'BUY' ? 'bg-accent-green/10' : 
                action.type === 'SELL' ? 'bg-accent-red/10' : 'bg-accent-yellow/10',
                isNew && 'ring-1 ring-white/20'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                    participant?.side === 'A'
                      ? 'bg-accent-blue/20 text-accent-blue'
                      : 'bg-accent-purple/20 text-accent-purple'
                  )}
                >
                  {participant?.side || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {formatAddress(participant?.address || '')}
                  </p>
                  <p className="text-xs text-text-muted">Tick #{action.tickIndex + 1}</p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    'text-sm font-bold',
                    action.type === 'BUY' ? 'text-accent-green' : 
                    action.type === 'SELL' ? 'text-accent-red' : 'text-accent-yellow'
                  )}
                >
                  {action.type}
                </p>
                <p className="text-xs text-text-muted">{formatCurrency(action.price)}</p>
              </div>
            </motion.div>
          );
        })
      )}
    </div>
  );
}
