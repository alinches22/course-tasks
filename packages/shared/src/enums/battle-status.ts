/**
 * Battle status enum representing the lifecycle of a battle
 */
export enum BattleStatus {
  /** Battle created, waiting for opponent */
  WAITING = 'WAITING',
  /** Both players matched, preparing to start */
  MATCHED = 'MATCHED',
  /** Battle is actively running, ticks being streamed */
  RUNNING = 'RUNNING',
  /** Battle completed, results finalized */
  FINISHED = 'FINISHED',
  /** Battle was canceled before completion */
  CANCELED = 'CANCELED',
}

/**
 * Check if a battle status allows joining
 */
export function canJoinBattle(status: BattleStatus): boolean {
  return status === BattleStatus.WAITING;
}

/**
 * Check if a battle is active (running or about to run)
 */
export function isBattleActive(status: BattleStatus): boolean {
  return status === BattleStatus.MATCHED || status === BattleStatus.RUNNING;
}

/**
 * Check if a battle has ended
 */
export function isBattleEnded(status: BattleStatus): boolean {
  return status === BattleStatus.FINISHED || status === BattleStatus.CANCELED;
}
