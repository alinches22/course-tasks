'use client';

import { motion } from 'framer-motion';
import { formatCountdown } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface BattleTimerProps {
  timeRemaining: number;
  totalTicks: number;
  currentIndex: number;
  status: string;
  countdown?: number | null;
}

export function BattleTimer({
  timeRemaining,
  totalTicks,
  currentIndex,
  status,
  countdown,
}: BattleTimerProps) {
  const progress = totalTicks > 0 ? (currentIndex / totalTicks) * 100 : 0;

  if (status === 'MATCHED' && countdown !== null && countdown !== undefined) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <p className="text-text-secondary mb-2">Battle starts in</p>
        <motion.div
          key={countdown}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-6xl font-bold text-accent-green text-glow-green"
        >
          {countdown}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Timer display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-2 h-2 rounded-full',
            status === 'RUNNING' ? 'bg-accent-green animate-pulse' : 'bg-text-muted'
          )} />
          <span className="text-sm text-text-secondary">
            {status === 'RUNNING' ? 'Live' : status}
          </span>
        </div>
        <div className="font-mono text-lg text-text-primary">
          {formatCountdown(timeRemaining)}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-surface rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-accent-green"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Tick counter */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>Tick {currentIndex + 1}</span>
        <span>{totalTicks} total</span>
      </div>
    </div>
  );
}
