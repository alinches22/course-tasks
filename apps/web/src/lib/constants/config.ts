export const APP_CONFIG = {
  name: 'TradeVersus',
  description: 'Skill-based PvP trading battles platform',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const;

export const API_CONFIG = {
  url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000/graphql',
  graphqlPath: '/graphql',
} as const;

export const WALLET_CONFIG = {
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
} as const;

export const BATTLE_CONFIG = {
  tickIntervalMs: 5000,
  countdownSeconds: 10,
  maxDurationSeconds: 300,
} as const;

export const UI_CONFIG = {
  toastDuration: 5000,
  animationDuration: 300,
  debounceMs: 300,
  pageSize: 20,
} as const;
