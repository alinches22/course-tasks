'use client';

import { cn } from '@/lib/utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'sm' | 'md';
  pulse?: boolean;
  className?: string;
}

const variants = {
  default: 'bg-surface text-text-secondary',
  success: 'bg-accent-green/10 text-accent-green border border-accent-green/30',
  warning: 'bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/30',
  danger: 'bg-accent-red/10 text-accent-red border border-accent-red/30',
  info: 'bg-accent-blue/10 text-accent-blue border border-accent-blue/30',
  outline: 'bg-transparent border border-border text-text-secondary',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

export function Badge({ children, variant = 'default', size = 'sm', pulse, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              variant === 'success' && 'bg-accent-green',
              variant === 'danger' && 'bg-accent-red',
              variant === 'warning' && 'bg-accent-yellow',
              variant === 'info' && 'bg-accent-blue',
              variant === 'default' && 'bg-text-secondary'
            )}
          />
          <span
            className={cn(
              'relative inline-flex rounded-full h-2 w-2',
              variant === 'success' && 'bg-accent-green',
              variant === 'danger' && 'bg-accent-red',
              variant === 'warning' && 'bg-accent-yellow',
              variant === 'info' && 'bg-accent-blue',
              variant === 'default' && 'bg-text-secondary'
            )}
          />
        </span>
      )}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: BadgeProps['variant']; label: string; pulse?: boolean }> = {
    WAITING: { variant: 'warning', label: 'Waiting', pulse: true },
    MATCHED: { variant: 'info', label: 'Matched', pulse: true },
    RUNNING: { variant: 'success', label: 'Live', pulse: true },
    FINISHED: { variant: 'default', label: 'Finished' },
    CANCELED: { variant: 'danger', label: 'Canceled' },
  };

  const { variant, label, pulse } = config[status] || { variant: 'default', label: status };

  return (
    <Badge variant={variant} pulse={pulse}>
      {label}
    </Badge>
  );
}
