import { BattleStatus } from '../enums/battle-status';
import { ActionType } from '../enums/action-type';
import { PublicUser } from './user';

/**
 * Battle representation
 */
export interface Battle {
  id: string;
  status: BattleStatus;
  scenarioId: string;
  commitHash: string;
  revealSalt: string | null;
  creatorId: string;
  opponentId: string | null;
  winnerId: string | null;
  createdAt: Date;
  matchedAt: Date | null;
  startedAt: Date | null;
  finishedAt: Date | null;
}

/**
 * Battle with player info
 */
export interface BattleWithPlayers extends Battle {
  creator: PublicUser;
  opponent: PublicUser | null;
  winner: PublicUser | null;
}

/**
 * Single tick data point
 */
export interface Tick {
  index: number;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Battle tick event (streamed during battle)
 */
export interface BattleTick {
  battleId: string;
  tick: Tick;
  currentIndex: number;
  totalTicks: number;
  timeRemaining: number;
}

/**
 * Battle state event
 */
export interface BattleState {
  battleId: string;
  status: BattleStatus;
  countdown: number | null;
  message: string;
}

/**
 * Player action during battle
 */
export interface BattleAction {
  id: string;
  battleId: string;
  userId: string;
  type: ActionType;
  price: number;
  tickIndex: number;
  serverTimestamp: Date;
}

/**
 * Player position during battle
 */
export interface PlayerPosition {
  userId: string;
  position: 'LONG' | 'SHORT' | 'FLAT';
  entryPrice: number | null;
  currentPnl: number;
  realizedPnl: number;
  actionCount: number;
}

/**
 * Battle result
 */
export interface BattleResult {
  battleId: string;
  winnerId: string | null;
  isDraw: boolean;
  creatorPnl: number;
  opponentPnl: number;
  creatorPoints: number;
  opponentPoints: number;
  scenarioId: string;
  revealSalt: string;
}

/**
 * Calculate PnL percentage
 */
export function calculatePnlPercentage(entryPrice: number, currentPrice: number, isLong: boolean): number {
  if (entryPrice === 0) return 0;
  const change = ((currentPrice - entryPrice) / entryPrice) * 100;
  return isLong ? change : -change;
}

/**
 * Format PnL for display
 */
export function formatPnl(pnl: number): string {
  const prefix = pnl >= 0 ? '+' : '';
  return `${prefix}${pnl.toFixed(2)}%`;
}
