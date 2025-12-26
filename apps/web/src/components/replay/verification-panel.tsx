'use client';

import { cn } from '@/lib/utils/cn';

interface VerificationPanelProps {
  verification: {
    scenarioId: string;
    revealSalt: string;
    commitHash: string;
    isValid: boolean;
  };
}

export function VerificationPanel({ verification }: VerificationPanelProps) {
  return (
    <div className="space-y-4">
      {/* Verification status */}
      <div
        className={cn(
          'flex items-center gap-3 p-4 rounded-lg border',
          verification.isValid
            ? 'bg-accent-green/10 border-accent-green/30'
            : 'bg-accent-red/10 border-accent-red/30'
        )}
      >
        {verification.isValid ? (
          <svg className="w-6 h-6 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-accent-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )}
        <div>
          <p className={cn('font-semibold', verification.isValid ? 'text-accent-green' : 'text-accent-red')}>
            {verification.isValid ? 'Provably Fair ✓' : 'Verification Failed'}
          </p>
          <p className="text-sm text-text-secondary">
            {verification.isValid
              ? 'The scenario hash matches the revealed data'
              : 'Hash mismatch detected'}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3">
        <div>
          <p className="text-xs text-text-muted mb-1">Scenario ID</p>
          <code className="text-xs text-text-primary bg-surface p-2 rounded block break-all">
            {verification.scenarioId}
          </code>
        </div>
        <div>
          <p className="text-xs text-text-muted mb-1">Reveal Salt</p>
          <code className="text-xs text-text-primary bg-surface p-2 rounded block break-all">
            {verification.revealSalt}
          </code>
        </div>
        <div>
          <p className="text-xs text-text-muted mb-1">Commit Hash</p>
          <code className="text-xs text-accent-green bg-surface p-2 rounded block break-all">
            {verification.commitHash}
          </code>
        </div>
      </div>

      {/* How to verify */}
      <div className="text-xs text-text-muted">
        <p className="font-medium mb-1">How to verify:</p>
        <code className="block bg-surface p-2 rounded">
          sha256(scenarioId + revealSalt) === commitHash
        </code>
      </div>
    </div>
  );
}
