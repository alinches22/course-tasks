'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQuery, useSubscription, useMutation } from 'urql';
import { GET_BATTLE, SUBMIT_ACTION } from '@/lib/graphql/operations/battles';
import {
  BATTLE_TICK_SUBSCRIPTION,
  BATTLE_STATE_SUBSCRIPTION,
  BATTLE_RESULT_SUBSCRIPTION,
} from '@/lib/graphql/operations/subscriptions';
import { useBattleStore } from '@/stores/battle.store';
import type { Tick, BattleResult } from '@/types';

export function useBattle(battleId: string) {
  const battleStore = useBattleStore();
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [result, setResult] = useState<BattleResult | null>(null);

  // Fetch initial battle data
  const [{ data: battleData, fetching }] = useQuery({
    query: GET_BATTLE,
    variables: { id: battleId },
    pause: !battleId,
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

  // Mutation for submitting actions
  const [, submitActionMutation] = useMutation(SUBMIT_ACTION);

  // Handle tick updates
  useEffect(() => {
    if (tickResult.data?.battleTick) {
      const { tick, currentIndex, totalTicks, timeRemaining } = tickResult.data.battleTick;
      setTicks((prev) => [...prev, tick]);
      battleStore.addTick(tick, currentIndex, totalTicks, timeRemaining);
    }
  }, [tickResult.data, battleStore]);

  // Handle state updates
  useEffect(() => {
    if (stateResult.data?.battleState) {
      const { status, countdown, message } = stateResult.data.battleState;
      battleStore.setStatus(status);
      battleStore.setCountdown(countdown);
      battleStore.setMessage(message);
    }
  }, [stateResult.data, battleStore]);

  // Handle result
  useEffect(() => {
    if (resultResult.data?.battleResult) {
      setResult(resultResult.data.battleResult);
    }
  }, [resultResult.data]);

  // Initialize battle store
  useEffect(() => {
    battleStore.setBattleId(battleId);
    if (battleData?.battle) {
      battleStore.setStatus(battleData.battle.status);
    }
    return () => {
      battleStore.reset();
      setTicks([]);
      setResult(null);
    };
  }, [battleId, battleData, battleStore]);

  // Submit action
  const submitAction = useCallback(
    async (type: 'BUY' | 'SELL', quantity = 1) => {
      const res = await submitActionMutation({
        input: { battleId, type, quantity },
      });
      return res;
    },
    [battleId, submitActionMutation]
  );

  return {
    battle: battleData?.battle,
    fetching,
    ticks,
    status: battleStore.status || battleData?.battle?.status,
    countdown: battleStore.countdown,
    currentIndex: battleStore.currentIndex,
    totalTicks: battleStore.totalTicks,
    timeRemaining: battleStore.timeRemaining,
    message: battleStore.message,
    result,
    currentPrice: ticks[ticks.length - 1]?.close ?? 0,
    submitAction,
  };
}
