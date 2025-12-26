'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Modal, ModalBody } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { formatAddress, formatPercentage, formatPoints } from '@/lib/utils/format';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils/cn';

interface BattleResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: {
    battleId: string;
    winner?: { id: string; address: string } | null;
    isDraw: boolean;
    pnlA: number;
    pnlB: number;
    pointsA: number;
    pointsB: number;
  };
  userId: string;
  participantSide: 'A' | 'B';
}

export function BattleResultModal({
  isOpen,
  onClose,
  result,
  userId,
  participantSide,
}: BattleResultModalProps) {
  const isWinner = result.winner?.id === userId;
  const yourPnl = participantSide === 'A' ? result.pnlA : result.pnlB;
  const opponentPnl = participantSide === 'A' ? result.pnlB : result.pnlA;
  const yourPoints = participantSide === 'A' ? result.pointsA : result.pointsB;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" closeOnOverlayClick={false}>
      <ModalBody className="py-8 text-center">
        {/* Result icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10 }}
          className={cn(
            'w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6',
            result.isDraw
              ? 'bg-accent-yellow/20'
              : isWinner
              ? 'bg-accent-green/20'
              : 'bg-accent-red/20'
          )}
        >
          {result.isDraw ? (
            <span className="text-4xl">🤝</span>
          ) : isWinner ? (
            <span className="text-4xl">🏆</span>
          ) : (
            <span className="text-4xl">💔</span>
          )}
        </motion.div>

        {/* Result text */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn(
            'text-3xl font-bold mb-2',
            result.isDraw
              ? 'text-accent-yellow'
              : isWinner
              ? 'text-accent-green'
              : 'text-accent-red'
          )}
        >
          {result.isDraw ? "It's a Draw!" : isWinner ? 'Victory!' : 'Defeat'}
        </motion.h2>

        {/* PnL comparison */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-8 my-8"
        >
          <div>
            <p className="text-sm text-text-muted mb-1">Your PnL</p>
            <p
              className={cn(
                'text-2xl font-bold',
                yourPnl >= 0 ? 'text-accent-green' : 'text-accent-red'
              )}
            >
              {formatPercentage(yourPnl)}
            </p>
          </div>
          <div className="text-2xl text-text-muted">vs</div>
          <div>
            <p className="text-sm text-text-muted mb-1">Opponent PnL</p>
            <p
              className={cn(
                'text-2xl font-bold',
                opponentPnl >= 0 ? 'text-accent-green' : 'text-accent-red'
              )}
            >
              {formatPercentage(opponentPnl)}
            </p>
          </div>
        </motion.div>

        {/* Points earned */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-surface rounded-lg p-4 mb-6"
        >
          <p className="text-sm text-text-secondary mb-1">Points Earned</p>
          <p className="text-2xl font-bold text-accent-yellow">+{formatPoints(yourPoints)}</p>
        </motion.div>

        {/* Winner info */}
        {result.winner && !result.isDraw && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-text-muted mb-6"
          >
            Winner: {formatAddress(result.winner.address)}
          </motion.p>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-4"
        >
          <Link href={ROUTES.REPLAY(result.battleId)}>
            <Button variant="secondary">View Replay</Button>
          </Link>
          <Link href={ROUTES.APP}>
            <Button>Back to Dashboard</Button>
          </Link>
        </motion.div>
      </ModalBody>
    </Modal>
  );
}
