'use client';

import { create } from 'zustand';

interface Tick {
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface BattleState {
  battleId: string | null;
  status: string | null;
  countdown: number | null;
  currentTick: Tick | null;
  ticks: Tick[];
  currentIndex: number;
  totalTicks: number;
  timeRemaining: number;
  message: string;

  setBattleId: (id: string | null) => void;
  setStatus: (status: string) => void;
  setCountdown: (countdown: number | null) => void;
  addTick: (tick: Tick, index: number, total: number, timeRemaining: number) => void;
  setMessage: (message: string) => void;
  reset: () => void;
}

const initialState = {
  battleId: null,
  status: null,
  countdown: null,
  currentTick: null,
  ticks: [],
  currentIndex: 0,
  totalTicks: 0,
  timeRemaining: 0,
  message: '',
};

export const useBattleStore = create<BattleState>()((set) => ({
  ...initialState,

  setBattleId: (id) => set({ battleId: id }),

  setStatus: (status) => set({ status }),

  setCountdown: (countdown) => set({ countdown }),

  addTick: (tick, index, total, timeRemaining) =>
    set((state) => ({
      currentTick: tick,
      ticks: [...state.ticks, tick],
      currentIndex: index,
      totalTicks: total,
      timeRemaining,
    })),

  setMessage: (message) => set({ message }),

  reset: () => set(initialState),
}));
