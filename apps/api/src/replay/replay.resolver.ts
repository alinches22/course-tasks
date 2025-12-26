import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ReplayService } from './replay.service';
import { ReplayModel } from './models/replay.model';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Resolver()
@UseGuards(JwtAuthGuard)
export class ReplayResolver {
  constructor(private replayService: ReplayService) {}

  @Query(() => ReplayModel, { description: 'Get replay data for a finished battle' })
  async replay(@Args('battleId', { type: () => ID }) battleId: string): Promise<ReplayModel> {
    const replayData = await this.replayService.getReplay(battleId);

    return {
      battleId: replayData.battleId,
      asset: replayData.asset,
      timeframe: replayData.timeframe,
      ticks: replayData.ticks,
      actions: replayData.actions.map((a) => ({
        userId: a.userId,
        type: a.type,
        quantity: a.quantity,
        price: a.price,
        tickIndex: a.tickIndex,
        serverTs: a.serverTs,
      })),
      participants: replayData.participants,
      result: {
        winnerId: replayData.result.winnerId ?? undefined,
        isDraw: replayData.result.isDraw,
        pnlA: replayData.result.pnlA,
        pnlB: replayData.result.pnlB,
        finalizedAt: replayData.result.finalizedAt,
      },
      verification: replayData.verification,
    };
  }
}
