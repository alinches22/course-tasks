'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery, useSubscription } from 'urql';
import { GET_BATTLE } from '@/lib/graphql/operations/battles';
import {
  BATTLE_TICK_SUBSCRIPTION,
  BATTLE_STATE_SUBSCRIPTION,
  BATTLE_RESULT_SUBSCRIPTION,
} from '@/lib/graphql/operations/subscriptions';
import { BattleChart } from '@/components/battle/battle-chart';
import { BattleTimer } from '@/components/battle/battle-timer';
import { BattleActions } from '@/components/battle/battle-actions';
import { BattleResultModal } from '@/components/battle/battle-result-modal';
import { StatusBadge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth.store';
import { formatPercentage } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface Tick {
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface PlayerPnl {
  oderId: string;
  pnl: number;
  position: string;
  side: string;
}

export default function BattlePage() {
  const params = useParams();
  const battleId = params.id as string;
  const { user } = useAuthStore();

  const [ticks, setTicks] = useState<Tick[]>([]);
  const [status, setStatus] = useState<string>('WAITING');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [message, setMessage] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalTicks, setTotalTicks] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [playerPnls, setPlayerPnls] = useState<PlayerPnl[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [battleResult, setBattleResult] = useState<any>(null);

  // Fetch initial battle data
  const [{ data: battleData, fetching }, refetch] = useQuery({
    query: GET_BATTLE,
    variables: { id: battleId },
  });

  // Subscribe to ticks
  const [tickResult] = useSubscription({
    query: BATTLE_TICK_SUBSCRIPTION,
    variables: { battleId },
    pause: !battleId,
  });

  // Subscribe to state changes
  const [stateResult] = useSubscription({
    query: BATTLE_STATE_SUBSCRIPTION,
    variables: { battleId },
    pause: !battleId,
  });

  // Subscribe to result
  const [resultResult] = useSubscription({
    query: BATTLE_RESULT_SUBSCRIPTION,
    variables: { battleId },
    pause: !battleId,
  });

  // Handle tick updates
  useEffect(() => {
    if (tickResult.data?.battleTick) {
      const { tick, currentIndex: idx, totalTicks: total, timeRemaining: remaining, players } = tickResult.data.battleTick;
      setTicks((prev) => [...prev, tick]);
      setCurrentIndex(idx);
      setTotalTicks(total);
      setTimeRemaining(remaining);
      if (players) {
        setPlayerPnls(players);
      }
    }
  }, [tickResult.data]);

  // Handle state updates
  useEffect(() => {
    if (stateResult.data?.battleState) {
      const { status: newStatus, countdown: newCountdown, message: newMessage } = stateResult.data.battleState;
      setStatus(newStatus);
      setCountdown(newCountdown);
      setMessage(newMessage);
      
      // Refetch battle data when status changes
      if (newStatus !== status) {
        refetch();
      }
    }
  }, [stateResult.data, status, refetch]);

  // Handle result
  useEffect(() => {
    if (resultResult.data?.battleResult) {
      setBattleResult(resultResult.data.battleResult);
      setShowResult(true);
    }
  }, [resultResult.data]);

  // Initialize status from battle data
  useEffect(() => {
    if (battleData?.battle) {
      setStatus(battleData.battle.status);
    }
  }, [battleData]);

  // Reset on unmount
  useEffect(() => {
    return () => {
      setTicks([]);
      setPlayerPnls([]);
    };
  }, [battleId]);

  if (fetching) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-[400px] rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const battle = battleData?.battle;
  if (!battle) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent-red/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-accent-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Battle Not Found</h2>
          <p className="text-text-secondary mb-4">This battle may have been cancelled or does not exist.</p>
          <a href="/app" className="text-accent-green hover:underline">Return to Dashboard</a>
        </motion.div>
      </div>
    );
  }

  const myParticipant = battle.participants.find((p: any) => p.user.id === user?.id);
  const myPnl = playerPnls.find((p) => p.oderId === user?.id);
  const lastTick = ticks[ticks.length - 1];
  const currentPrice = lastTick?.close ?? 0;
  const isActive = status === 'ACTIVE';
  const isWaiting = status === 'WAITING';
  const isMatched = status === 'MATCHED';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary">{battle.asset}</h1>
              <StatusBadge status={status} />
            </div>
            <p className="text-text-secondary">{battle.timeframe} timeframe</p>
          </div>
          {currentPrice > 0 && (
            <div className="text-right">
              <p className="text-sm text-text-muted">Current Price</p>
              <p className="text-2xl font-bold text-text-primary font-mono">
                ${currentPrice.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-2">
            <BattleChart ticks={ticks} className="h-[400px]" />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Timer / Countdown */}
            <Card>
              <CardContent className="p-4">
                {isWaiting ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full border-2 border-accent-yellow/30 border-t-accent-yellow animate-spin" />
                    <p className="text-lg font-bold text-text-primary mb-1">Waiting for Opponent</p>
                    <p className="text-sm text-text-muted">Share the battle link to invite someone</p>
                  </div>
                ) : (
                  <>
                    <BattleTimer
                      timeRemaining={timeRemaining}
                      totalTicks={totalTicks}
                      currentIndex={currentIndex}
                      status={status}
                      countdown={countdown}
                    />
                    {message && (
                      <p className="text-center text-sm text-accent-green mt-2">{message}</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Player PnLs */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Players</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {battle.participants.map((p: any) => {
                    const pnlData = playerPnls.find((pl) => pl.oderId === p.user.id);
                    const isMe = p.user.id === user?.id;
                    const pnl = pnlData?.pnl ?? 0;
                    const hasData = isActive && playerPnls.length > 0;
                    
                    return (
                      <div
                        key={p.id}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-lg',
                          isMe ? 'bg-accent-green/10 border border-accent-green/30' : 'bg-surface'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <div
                              className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                                p.side === 'A'
                                  ? 'bg-accent-blue/20 text-accent-blue'
                                  : 'bg-accent-purple/20 text-accent-purple'
                              )}
                            >
                              {p.side}
                            </div>
                            {/* Online indicator */}
                            {(isMatched || isActive) && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-accent-green rounded-full border-2 border-background-primary" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              {isMe ? 'You' : 'Opponent'}
                            </p>
                            <p className="text-xs text-text-muted">
                              {hasData ? (pnlData?.position || 'FLAT') : (isMatched ? 'Ready' : 'Connected')}
                            </p>
                          </div>
                        </div>
                        {hasData ? (
                          <div
                            className={cn(
                              'text-lg font-bold number-ticker',
                              pnl >= 0 ? 'text-accent-green' : 'text-accent-red'
                            )}
                          >
                            {formatPercentage(pnl)}
                          </div>
                        ) : (
                          <span className="text-sm text-text-muted">--</span>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Show placeholder for missing opponent */}
                  {isWaiting && battle.participants.length < 2 && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-surface border border-dashed border-border">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center">
                          <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-muted">Waiting...</p>
                          <p className="text-xs text-text-muted">Opponent will join soon</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="p-4">
                <BattleActions
                  battleId={battleId}
                  isActive={isActive}
                  currentPrice={currentPrice}
                  position={myPnl?.position}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>

      {/* Result Modal */}
      {battleResult && (
        <BattleResultModal
          isOpen={showResult}
          onClose={() => setShowResult(false)}
          result={battleResult}
          userId={user?.id || ''}
          participantSide={myParticipant?.side || 'A'}
        />
      )}
    </div>
  );
}
