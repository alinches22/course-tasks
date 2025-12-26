/**
 * User representation
 */
export interface User {
  id: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Public user info (safe to expose)
 */
export interface PublicUser {
  id: string;
  address: string;
}

/**
 * User statistics
 */
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

/**
 * Truncate wallet address for display
 */
export function truncateAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
