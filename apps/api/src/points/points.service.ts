import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '../config/config.service';
import { getWeekStart } from '../common/utils/time.util';
import { PointsLedger, WeeklyPool } from '@prisma/client';

// Points configuration
const WIN_POINTS = 100;
const LOSS_POINTS = 25;
const DRAW_POINTS = 50;
const PNL_BONUS_MULTIPLIER = 10;
const MAX_PNL_BONUS = 50;

@Injectable()
export class PointsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Award points after a battle
   */
  async awardBattlePoints(
    userId: string,
    battleId: string,
    isWinner: boolean,
    isDraw: boolean,
    pnlPercent: number,
  ): Promise<number> {
    let basePoints: number;
    let reason: string;

    if (isDraw) {
      basePoints = DRAW_POINTS;
      reason = 'DRAW';
    } else if (isWinner) {
      basePoints = WIN_POINTS;
      reason = 'WIN';
    } else {
      basePoints = LOSS_POINTS;
      reason = 'LOSS';
    }

    // Calculate PnL bonus (only for positive PnL)
    let pnlBonus = 0;
    if (pnlPercent > 0) {
      pnlBonus = Math.min(Math.floor(pnlPercent * PNL_BONUS_MULTIPLIER), MAX_PNL_BONUS);
    }

    const totalPoints = basePoints + pnlBonus;

    // Record in ledger
    await this.prisma.pointsLedger.create({
      data: {
        userId,
        battleId,
        points: totalPoints,
        reason: pnlBonus > 0 ? `${reason}_WITH_BONUS` : reason,
      },
    });

    // Add to weekly pool
    await this.addToWeeklyPool(totalPoints);

    return totalPoints;
  }

  /**
   * Add points to weekly pool
   */
  private async addToWeeklyPool(points: number): Promise<void> {
    const weekStart = getWeekStart();
    const feePercent = this.configService.weeklyPoolPercent / 100;
    const feeAmount = points * feePercent;

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
   * Get total points for a user
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
   * Get leaderboard
   */
  async getLeaderboard(take: number = 100): Promise<{ userId: string; totalPoints: number }[]> {
    const result = await this.prisma.pointsLedger.groupBy({
      by: ['userId'],
      _sum: { points: true },
      orderBy: {
        _sum: { points: 'desc' },
      },
      take,
    });

    return result.map((r) => ({
      userId: r.userId,
      totalPoints: r._sum.points || 0,
    }));
  }
}
