import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getWeekStart } from '../common/utils/time.util';
import { PointsLedger, WeeklyPool } from '@prisma/client';

@Injectable()
export class PointsService {
  constructor(
    private prisma: PrismaService,
  ) {}

  /**
   * Award points after a battle using winner-takes-all logic
   * Winner gets: 2 * stake - fee
   * Loser gets: 0
   * Draw: each gets stake back (no fee)
   */
  async awardBattlePoints(
    userId: string,
    battleId: string,
    isWinner: boolean,
    isDraw: boolean,
    _pnlPercent: number,
  ): Promise<number> {
    // Get battle to read stake and fee
    const battle = await this.prisma.battle.findUnique({
      where: { id: battleId },
    });

    if (!battle) return 0;

    const stake = Number(battle.stakeAmount);
    const feeBps = battle.feeBps;
    const feePercent = feeBps / 10000; // Convert basis points to decimal

    let points: number;
    let reason: string;

    if (isDraw) {
      // Draw: return stake (no fee)
      points = stake;
      reason = 'DRAW';
    } else if (isWinner) {
      // Winner: 2 * stake - fee
      const totalPool = stake * 2;
      const fee = totalPool * feePercent;
      points = Math.floor(totalPool - fee);
      reason = 'WIN';

      // Add fee to weekly pool
      await this.addToWeeklyPool(fee);
    } else {
      // Loser: 0 points
      points = 0;
      reason = 'LOSS';
    }

    // Record in ledger
    await this.prisma.pointsLedger.create({
      data: {
        userId,
        battleId,
        points,
        reason: `${reason}_STAKE`,
      },
    });

    return points;
  }

  /**
   * Record stake deposit when joining a battle
   */
  async recordStakeDeposit(userId: string, battleId: string, amount: number): Promise<void> {
    await this.prisma.pointsLedger.create({
      data: {
        userId,
        battleId,
        points: -amount, // Negative = deducted
        reason: 'STAKE_DEPOSIT',
      },
    });
  }

  /**
   * Add fee to weekly pool
   */
  private async addToWeeklyPool(feeAmount: number): Promise<void> {
    const weekStart = getWeekStart();

    await this.prisma.weeklyPool.upsert({
      where: { weekStart },
      update: {
        totalFees: {
          increment: feeAmount,
        },
      },
      create: {
        weekStart,
        totalFees: feeAmount,
      },
    });
  }

  /**
   * Get total points (balance) for a user
   */
  async getTotalPoints(userId: string): Promise<number> {
    const result = await this.prisma.pointsLedger.aggregate({
      where: { userId },
      _sum: { points: true },
    });
    return result._sum.points || 0;
  }

  /**
   * Get points history for a user
   */
  async getPointsHistory(
    userId: string,
    take: number = 20,
    cursor?: string,
  ): Promise<{ entries: PointsLedger[]; hasMore: boolean }> {
    const entries = await this.prisma.pointsLedger.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
    });

    const hasMore = entries.length > take;
    return {
      entries: hasMore ? entries.slice(0, -1) : entries,
      hasMore,
    };
  }

  /**
   * Get current weekly pool
   */
  async getCurrentWeeklyPool(): Promise<WeeklyPool | null> {
    const weekStart = getWeekStart();
    return this.prisma.weeklyPool.findUnique({
      where: { weekStart },
    });
  }

  /**
   * Get all weekly pools (history)
   */
  async getWeeklyPoolHistory(take: number = 10): Promise<WeeklyPool[]> {
    return this.prisma.weeklyPool.findMany({
      orderBy: { weekStart: 'desc' },
      take,
    });
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(take: number = 100): Promise<{ userId: string; totalPoints: number; user?: { id: string; address: string } }[]> {
    const result = await this.prisma.pointsLedger.groupBy({
      by: ['userId'],
      _sum: { points: true },
      orderBy: {
        _sum: { points: 'desc' },
      },
      take,
    });

    // Get user details
    const userIds = result.map((r) => r.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, address: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return result.map((r) => ({
      userId: r.userId,
      totalPoints: r._sum.points || 0,
      user: userMap.get(r.userId),
    }));
  }

  /**
   * Give initial points to new user (signup bonus)
   */
  async giveSignupBonus(userId: string, amount: number = 1000): Promise<void> {
    // Check if user already has any entries
    const existing = await this.prisma.pointsLedger.findFirst({
      where: { userId },
    });

    if (!existing) {
      await this.prisma.pointsLedger.create({
        data: {
          userId,
          points: amount,
          reason: 'SIGNUP_BONUS',
        },
      });
    }
  }
}
