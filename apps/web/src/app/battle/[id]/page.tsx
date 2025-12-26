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
import { BattlePnl } from '@/components/battle/battle-pnl';
import { OpponentStatus } from '@/components/battle/opponent-status';
import { BattleResultModal } from '@/components/battle/battle-result-modal';
import { StatusBadge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth.store';
import { useBattleStore } from '@/stores/battle.store';

interface Tick {
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export default function BattlePage() {
  const params = useParams();
  const battleId = params.id as string;
  const { user } = useAuthStore();
  
  // Get individual actions from store to avoid dependency issues
  const addTick = useBattleStore((state) => state.addTick);
  const setStatus = useBattleStore((state) => state.setStatus);
  const setCountdown = useBattleStore((state) => state.setCountdown);
  const setMessage = useBattleStore((state) => state.setMessage);
  const setBattleId = useBattleStore((state) => state.setBattleId);
  const reset = useBattleStore((state) => state.reset);
  
  // Get state values
  const storeStatus = useBattleStore((state) => state.status);
  const storeCountdown = useBattleStore((state) => state.countdown);
  const storeCurrentIndex = useBattleStore((state) => state.currentIndex);
  const storeTotalTicks = useBattleStore((state) => state.totalTicks);
  const storeTimeRemaining = useBattleStore((state) => state.timeRemaining);

  const [ticks, setTicks] = useState<Tick[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [battleResult, setBattleResult] = useState<any>(null);

  // Fetch initial battle data
  const [{ data: battleData, fetching }] = useQuery({
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
      const { tick, currentIndex, totalTicks, timeRemaining } = tickResult.data.battleTick;
      setTicks((prev) => [...prev, tick]);
      addTick(tick, currentIndex, totalTicks, timeRemaining);
    }
  }, [tickResult.data, addTick]);

  // Handle state updates
  useEffect(() => {
    if (stateResult.data?.battleState) {
      const { status, countdown, message } = stateResult.data.battleState;
      setStatus(status);
      setCountdown(countdown);
      setMessage(message);
    }
  }, [stateResult.data, setStatus, setCountdown, setMessage]);

  // Handle result
  useEffect(() => {
    if (resultResult.data?.battleResult) {
      setBattleResult(resultResult.data.battleResult);
      setShowResult(true);
    }
  }, [resultResult.data]);

  // Initialize battle store
  useEffect(() => {
    setBattleId(battleId);
    if (battleData?.battle) {
      setStatus(battleData.battle.status);
    }
    return () => reset();
  }, [battleId, battleData, setBattleId, setStatus, reset]);

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
        <p className="text-text-secondary">Battle not found</p>
      </div>
    );
  }

  const myParticipant = battle.participants.find((p: any) => p.user.id === user?.id);
  const status = storeStatus || battle.status;
  const lastTick = ticks[ticks.length - 1];
  const currentPrice = lastTick?.close ?? 0;
  const isRunning = status === 'RUNNING';

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
            {/* Timer */}
            <Card>
              <CardContent className="p-4">
                <BattleTimer
                  timeRemaining={storeTimeRemaining}
                  totalTicks={storeTotalTicks}
                  currentIndex={storeCurrentIndex}
                  status={status}
                  countdown={storeCountdown}
                />
              </CardContent>
            </Card>

            {/* Players */}
            <Card>
              <CardContent className="p-4 space-y-3">
                {battle.participants.map((p: any) => (
                  <OpponentStatus
                    key={p.id}
                    address={p.user.address}
                    side={p.side}
                    isYou={p.user.id === user?.id}
                  />
                ))}
              </CardContent>
            </Card>

            {/* PnL */}
            {myParticipant && (
              <Card>
                <CardContent className="p-4">
                  <BattlePnl
                    pnl={0} // Real PnL would come from position tracking
                    startingBalance={myParticipant.startingBalance}
                  />
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardContent className="p-4">
                <BattleActions
                  battleId={battleId}
                  isRunning={isRunning}
                  currentPrice={currentPrice}
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
