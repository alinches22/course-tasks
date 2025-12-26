'use client';

import { formatAddress } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface OpponentStatusProps {
  address: string;
  side: 'A' | 'B';
  isYou?: boolean;
}

export function OpponentStatus({ address, side, isYou }: OpponentStatusProps) {
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg',
      isYou ? 'bg-accent-green/10 border border-accent-green/30' : 'bg-surface'
    )}>
      <div className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold',
        side === 'A' ? 'bg-accent-blue/20 text-accent-blue' : 'bg-accent-purple/20 text-accent-purple'
      )}>
        {side}
      </div>
      <div>
        <p className="font-medium text-text-primary">
          {formatAddress(address)}
          {isYou && <span className="text-accent-green ml-2">(You)</span>}
        </p>
        <p className="text-xs text-text-muted">Player {side}</p>
      </div>
    </div>
  );
}
