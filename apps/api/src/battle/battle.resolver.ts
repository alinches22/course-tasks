import { Resolver, Query, Mutation, Subscription, Args, ID } from '@nestjs/graphql';
import { UseGuards, Inject } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { BattleService } from './battle.service';
import { BattleEngineService } from './battle-engine.service';
import { BattleModel, BattleListModel } from './models/battle.model';
import { BattleTickModel } from './models/battle-tick.model';
import { BattleStateModel } from './models/battle-state.model';
import { BattleResultModel } from './models/battle-result.model';
import { BattleReconnectionModel } from './models/battle-reconnection.model';
import { CreateBattleInput } from './dto/create-battle.input';
import { JoinBattleInput } from './dto/join-battle.input';
import { SubmitActionInput } from './dto/submit-action.input';
import { BattlesFilterInput } from './dto/battles-filter.input';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { PUB_SUB, BATTLE_TICK, BATTLE_STATE, BATTLE_RESULT } from '../graphql/pubsub.provider';
import { BattleStatus } from '@prisma/client';
import { BattleStatusEnum, ParticipantSideEnum } from './enums/battle-status.enum';

@Resolver(() => BattleModel)
@UseGuards(JwtAuthGuard)
export class BattleResolver {
  constructor(
    @Inject(PUB_SUB) private pubSub: PubSub,
    private battleService: BattleService,
    private battleEngineService: BattleEngineService,
  ) {}

  @Query(() => BattleListModel, { description: 'Get list of battles' })
  async battles(
    @Args('filter', { nullable: true }) filter: BattlesFilterInput,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<BattleListModel> {
    const result = await this.battleService.findMany({
      status: filter?.status as unknown as BattleStatus,
      userId: filter?.myBattles ? user.userId : undefined,
      cursor: filter?.cursor,
      take: filter?.take,
    });

    return {
      battles: result.battles.map((b) => this.mapBattle(b)),
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  }

  @Query(() => BattleModel, { description: 'Get battle by ID' })
  async battle(@Args('id', { type: () => ID }) id: string): Promise<BattleModel> {
    const battle = await this.battleService.findByIdOrThrow(id);
    return this.mapBattle(battle);
  }

  @Query(() => BattleReconnectionModel, { 
    description: 'Get current battle state for reconnection (only recent ticks, no future data)',
    nullable: true,
  })
  async battleReconnect(@Args('id', { type: () => ID }) id: string): Promise<BattleReconnectionModel | null> {
    const state = await this.battleEngineService.getReconnectionState(id);
    if (!state) return null;

    return {
      battleId: id,
      status: state.status,
      currentTickIndex: state.currentTickIndex,
      totalTicks: state.totalTicks,
      timeRemaining: state.timeRemaining,
      recentTicks: state.recentTicks,
      players: state.players,
    };
  }

  @Mutation(() => BattleModel, { description: 'Create a new battle' })
  async createBattle(
    @Args('input', { nullable: true }) input: CreateBattleInput,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<BattleModel> {
    const battle = await this.battleService.createBattle(
      user.userId,
      input?.startingBalance || 10000,
      input?.scenarioId,
      user.address, // Pass address for dev user creation
    );
    return this.mapBattle(battle);
  }

  @Mutation(() => BattleModel, { description: 'Join an existing battle' })
  async joinBattle(
    @Args('input') input: JoinBattleInput,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<BattleModel> {
    const battle = await this.battleService.joinBattle(input.battleId, user.userId, user.address);

    // Start the battle engine
    setImmediate(() => {
      this.battleEngineService.startBattle(battle.id);
    });

    return this.mapBattle(battle);
  }

  @Mutation(() => Boolean, { description: 'Submit a trading action' })
  async submitAction(
    @Args('input') input: SubmitActionInput,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<boolean> {
    await this.battleEngineService.processAction(
      input.battleId,
      user.userId,
      input.type,
      input.quantity,
    );
    return true;
  }

  @Mutation(() => BattleModel, { description: 'Cancel a battle (creator only, WAITING status only)' })
  async cancelBattle(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<BattleModel> {
    await this.battleService.cancelBattle(id, user.userId);
    const battle = await this.battleService.findByIdOrThrow(id);
    return this.mapBattle(battle);
  }

  @Subscription(() => BattleTickModel, {
    description: 'Subscribe to battle tick updates',
    filter: (payload, variables) => {
      return payload.battleTick.battleId === variables.battleId;
    },
  })
  battleTick(@Args('battleId', { type: () => ID }) battleId: string) {
    return this.pubSub.asyncIterator(`${BATTLE_TICK}.${battleId}`);
  }

  @Subscription(() => BattleStateModel, {
    description: 'Subscribe to battle state changes',
    filter: (payload, variables) => {
      return payload.battleState.battleId === variables.battleId;
    },
  })
  battleState(@Args('battleId', { type: () => ID }) battleId: string) {
    return this.pubSub.asyncIterator(`${BATTLE_STATE}.${battleId}`);
  }

  @Subscription(() => BattleResultModel, {
    description: 'Subscribe to battle result',
    filter: (payload, variables) => {
      return payload.battleResult.battleId === variables.battleId;
    },
  })
  battleResult(@Args('battleId', { type: () => ID }) battleId: string) {
    return this.pubSub.asyncIterator(`${BATTLE_RESULT}.${battleId}`);
  }

  private mapBattle(battle: any): BattleModel {
    // Only reveal scenarioId and salt if battle is finished
    const isFinished = battle.status === BattleStatus.FINISHED;

    return {
      id: battle.id,
      status: battle.status as BattleStatusEnum,
      commitHash: battle.commitHash,
      revealSalt: isFinished ? battle.revealSalt : undefined,
      scenarioId: isFinished ? battle.scenarioId : undefined,
      asset: battle.scenario?.asset,
      timeframe: battle.scenario?.timeframe,
      participants: battle.participants.map((p: any) => ({
        id: p.id,
        side: p.side as ParticipantSideEnum,
        user: {
          id: p.user.id,
          address: p.user.address,
          createdAt: p.user.createdAt,
        },
        startingBalance: Number(p.startingBalance),
        currentBalance: Number(p.currentBalance),
        createdAt: p.createdAt,
      })),
      createdAt: battle.createdAt,
      matchedAt: battle.matchedAt,
      startedAt: battle.startedAt,
      finishedAt: battle.finishedAt,
    };
  }
}
