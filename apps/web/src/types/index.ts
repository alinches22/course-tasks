// User types
export interface User {
  id: string;
  address: string;
  createdAt: string;
}

// Battle types
export type BattleStatus = 'WAITING' | 'MATCHED' | 'RUNNING' | 'FINISHED' | 'CANCELED';

export interface Battle {
  id: string;
  status: BattleStatus;
  commitHash: string;
  revealSalt: string | null;
  scenarioId: string | null;
  asset: string;
  timeframe: string;
  participants: BattleParticipant[];
  createdAt: string;
  matchedAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface BattleParticipant {
  id: string;
  side: 'A' | 'B';
  user: User;
  startingBalance: number;
  currentBalance: number;
}

// Tick types
export interface Tick {
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Action types
export type ActionType = 'BUY' | 'SELL';

export interface Action {
  userId: string;
  type: ActionType;
  quantity: number;
  price: number;
  tickIndex: number;
  serverTs: string;
}

// Result types
export interface BattleResult {
  battleId: string;
  winner: User | null;
  isDraw: boolean;
  pnlA: number;
  pnlB: number;
  pointsA: number;
  pointsB: number;
  scenarioId: string;
  revealSalt: string;
  finalizedAt: string;
}

// Replay types
export interface Replay {
  battleId: string;
  asset: string;
  timeframe: string;
  ticks: Tick[];
  actions: Action[];
  participants: ReplayParticipant[];
  result: ReplayResult;
  verification: ReplayVerification;
}

export interface ReplayParticipant {
  oderId: string;
  address: string;
  side: 'A' | 'B';
  startingBalance: number;
  finalPnl: number;
}

export interface ReplayResult {
  winnerId: string | null;
  isDraw: boolean;
  pnlA: number;
  pnlB: number;
  finalizedAt: string;
}

export interface ReplayVerification {
  scenarioId: string;
  revealSalt: string;
  commitHash: string;
  isValid: boolean;
}

// Points types
export interface PointsEntry {
  id: string;
  oderId: string;
  battleId: string | null;
  points: number;
  reason: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  oderId: string;
  totalPoints: number;
}

// Stats types
export interface UserStats {
  userId: string;
  totalBattles: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  totalPoints: number;
  weeklyPoints: number;
}
