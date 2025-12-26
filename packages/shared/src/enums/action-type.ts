/**
 * Trading action types available during a battle
 */
export enum ActionType {
  /** Open or add to a long position */
  BUY = 'BUY',
  /** Close position or open/add to a short position */
  SELL = 'SELL',
}

/**
 * Get the opposite action type
 */
export function getOppositeAction(action: ActionType): ActionType {
  return action === ActionType.BUY ? ActionType.SELL : ActionType.BUY;
}

/**
 * Get display label for action type
 */
export function getActionLabel(action: ActionType): string {
  return action === ActionType.BUY ? 'Buy' : 'Sell';
}

/**
 * Get color class for action type (Tailwind)
 */
export function getActionColor(action: ActionType): string {
  return action === ActionType.BUY ? 'text-accent-green' : 'text-accent-red';
}
