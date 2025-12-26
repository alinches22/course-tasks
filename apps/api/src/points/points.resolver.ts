import { Resolver, Query, Args, Int, Mutation } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PointsService } from './points.service';
import { PointsHistoryModel, WeeklyPoolModel, LeaderboardEntryModel } from './models/points-ledger.model';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Resolver()
@UseGuards(JwtAuthGuard)
export class PointsResolver {
  constructor(private pointsService: PointsService) {}

  @Query(() => Int, { description: 'Get total points for current user' })
  async myTotalPoints(@CurrentUser() user: CurrentUserPayload): Promise<number> {
    return this.pointsService.getTotalPoints(user.userId);
  }

  @Query(() => PointsHistoryModel, { description: 'Get points history for current user' })
  async myPointsHistory(
    @CurrentUser() user: CurrentUserPayload,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
    @Args('cursor', { nullable: true }) cursor?: string,
  ): Promise<PointsHistoryModel> {
    const result = await this.pointsService.getPointsHistory(user.userId, take || 20, cursor);
    return {
      entries: result.entries.map((e) => ({
        id: e.id,
        userId: e.userId,
        battleId: e.battleId ?? undefined,
        points: e.points,
        reason: e.reason,
        createdAt: e.createdAt,
      })),
      hasMore: result.hasMore,
    };
  }

  @Query(() => WeeklyPoolModel, { nullable: true, description: 'Get current weekly pool' })
  async currentWeeklyPool(): Promise<WeeklyPoolModel | null> {
    const pool = await this.pointsService.getCurrentWeeklyPool();
    if (!pool) return null;

    return {
      id: pool.id,
      weekStart: pool.weekStart,
      totalFees: Number(pool.totalFees),
      distributedAt: pool.distributedAt ?? undefined,
    };
  }

  @Query(() => WeeklyPoolModel, { nullable: true, description: 'Alias for currentWeeklyPool' })
  async weeklyPool(): Promise<WeeklyPoolModel | null> {
    return this.currentWeeklyPool();
  }

  @Query(() => [WeeklyPoolModel], { description: 'Get weekly pool history' })
  async weeklyPoolHistory(
    @Args('take', { type: () => Int, nullable: true }) take?: number,
  ): Promise<WeeklyPoolModel[]> {
    const pools = await this.pointsService.getWeeklyPoolHistory(take || 10);
    return pools.map((pool) => ({
      id: pool.id,
      weekStart: pool.weekStart,
      totalFees: Number(pool.totalFees),
      distributedAt: pool.distributedAt ?? undefined,
    }));
  }

  @Query(() => [LeaderboardEntryModel], { description: 'Get points leaderboard' })
  async leaderboard(
    @Args('take', { type: () => Int, nullable: true }) take?: number,
  ): Promise<LeaderboardEntryModel[]> {
    const entries = await this.pointsService.getLeaderboard(take || 100);
    return entries.map((e, index) => ({
      rank: index + 1,
      userId: e.userId,
      totalPoints: e.totalPoints,
    }));
  }

  @Mutation(() => Boolean, { description: 'Claim signup bonus (once per user)' })
  async claimSignupBonus(@CurrentUser() user: CurrentUserPayload): Promise<boolean> {
    await this.pointsService.giveSignupBonus(user.userId);
    return true;
  }
}
