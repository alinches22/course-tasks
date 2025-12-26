/**
 * Battle configuration constants
 */
export const BATTLE_CONFIG = {
  /** Interval between ticks in milliseconds */
  TICK_INTERVAL_MS: 5000,
  /** Countdown before battle starts in seconds */
  COUNTDOWN_SECONDS: 10,
  /** Maximum battle duration in seconds */
  MAX_DURATION_SECONDS: 300,
  /** Minimum time between actions in milliseconds */
  ACTION_COOLDOWN_MS: 1000,
  /** Maximum actions per battle per player */
  MAX_ACTIONS_PER_BATTLE: 50,
} as const;

/**
 * Points configuration
 */
export const POINTS_CONFIG = {
  /** Points for winning a battle */
  WIN_POINTS: 100,
  /** Points for losing a battle */
  LOSS_POINTS: 25,
  /** Points for a draw */
  DRAW_POINTS: 50,
  /** Bonus points per percent PnL (capped) */
  PNL_BONUS_MULTIPLIER: 10,
  /** Maximum PnL bonus points */
  MAX_PNL_BONUS: 50,
  /** Weekly pool percentage of total points */
  WEEKLY_POOL_PERCENT: 10,
  /** Team fee percentage */
  TEAM_FEE_PERCENT: 5,
} as const;

/**
 * WebSocket configuration
 */
export const WS_CONFIG = {
  /** Ping interval in milliseconds */
  PING_INTERVAL_MS: 15000,
  /** Connection timeout in milliseconds */
  CONNECTION_TIMEOUT_MS: 30000,
  /** Reconnection attempts */
  MAX_RECONNECT_ATTEMPTS: 5,
  /** Reconnection delay in milliseconds */
  RECONNECT_DELAY_MS: 1000,
} as const;

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT_CONFIG = {
  /** Time window in seconds */
  TTL_SECONDS: 60,
  /** Maximum requests per window */
  LIMIT: 100,
  /** Action submission limit per minute */
  ACTION_LIMIT_PER_MINUTE: 30,
} as const;

/**
 * Authentication configuration
 */
export const AUTH_CONFIG = {
  /** Nonce expiry time in milliseconds */
  NONCE_EXPIRY_MS: 5 * 60 * 1000, // 5 minutes
  /** JWT expiry time */
  JWT_EXPIRY: '7d',
  /** Message prefix for signature */
  SIGN_MESSAGE_PREFIX: 'Sign this message to authenticate with TradeVersus:\n\nNonce: ',
} as const;

/**
 * UI configuration
 */
export const UI_CONFIG = {
  /** Chart animation duration in ms */
  CHART_ANIMATION_MS: 300,
  /** Toast display duration in ms */
  TOAST_DURATION_MS: 5000,
  /** Debounce delay for inputs in ms */
  DEBOUNCE_MS: 300,
  /** Page size for battle lists */
  BATTLES_PAGE_SIZE: 20,
} as const;
