'use client';

import { motion } from 'framer-motion';
import { formatPercentage, formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface BattlePnlProps {
  pnl: number;
  startingBalance: number;
  label?: string;
}

export function BattlePnl({ pnl, startingBalance, label = 'Your PnL' }: BattlePnlProps) {
  const isPositive = pnl >= 0;
  const currentBalance = startingBalance * (1 + pnl / 100);

  return (
    <div className="text-center">
      <p className="text-sm text-text-secondary mb-1">{label}</p>
      <motion.div
        key={pnl.toFixed(2)}
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        className={cn(
          'text-3xl font-bold number-ticker',
          isPositive ? 'text-accent-green text-glow-green' : 'text-accent-red text-glow-red'
        )}
      >
        {formatPercentage(pnl)}
      </motion.div>
      <p className="text-sm text-text-muted mt-1">
        {formatCurrency(currentBalance)}
      </p>
    </div>
  );
}
