import { Injectable, Inject, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '../config/config.service';
import { ScenarioService } from '../scenario/scenario.service';
import { ActionService } from '../action/action.service';
import { PointsService } from '../points/points.service';
import { BattleService } from './battle.service';
import { PUB_SUB, BATTLE_TICK, BATTLE_STATE, BATTLE_RESULT } from '../graphql/pubsub.provider';
import { ActionType, ParticipantSide } from '@prisma/client';
import { ActionTypeEnum } from './enums/battle-status.enum';

interface PlayerState {
  participantId: string;
  oderId: string;
  position: 'LONG' | 'SHORT' | 'FLAT';
  entryPrice: number;
  quantity: number;
  realizedPnl: number;
  unrealizedPnl: number;
  balance: number;
  side: ParticipantSide;
}

interface BattleRuntimeState {
  battleId: string;
  scenarioId: string;
  currentTickIndex: number;
  totalTicks: number;
  tickIntervalMs: number;
  startingBalance: number;
  playerStates: Map<string, PlayerState>;
  isRunning: boolean;
  intervalId?: NodeJS.Timeout;
  serverSeed: string;
  startedAt: Date;
}

// Max ticks to include in reconnection window (no future leaks)
const TICK_WINDOW_SIZE = 5;
// Max actions per second per user
const MAX_ACTIONS_PER_SECOND = 3;

@Injectable()
export class BattleEngineService {
  private activeBattles: Map<string, BattleRuntimeState> = new Map();

  constructor(
    @Inject(PUB_SUB) private pubSub: PubSub,
    private prisma: PrismaService,
    private redisService: RedisService,
    private configService: ConfigService,
    private scenarioService: ScenarioService,
    private battleService: BattleService,
    private actionService: ActionService,
    private pointsService: PointsService,
  ) {}

  /**
   * Start a battle after countdown
   * Uses LOCKED params from battle record for fairness
   */
  async startBattle(battleId: string): Promise<void> {
    const battle = await this.battleService.findByIdOrThrow(battleId);

    if (battle.status !== 'MATCHED') {
      throw new BadRequestException('Battle must be in MATCHED status to start');
    }

    // Use LOCKED params from battle record (not scenario)
    const lockedTickInterval = (battle as any).tickIntervalMs || this.configService.battleTickIntervalMs;
    const lockedStartingBalance = Number((battle as any).startingBalance) || 10000;
    const lockedTotalTicks = (battle as any).totalTicks || 30;
    const serverSeed = (battle as any).serverSeed || '';

    // Initialize player states
    const playerStates = new Map<string, PlayerState>();
    for (const participant of battle.participants) {
      playerStates.set(participant.userId, {
        participantId: participant.id,
        oderId: participant.userId,
        position: 'FLAT',
        entryPrice: 0,
        quantity: 0,
        realizedPnl: 0,
        unrealizedPnl: 0,
        balance: lockedStartingBalance,
        side: participant.side,
      });
    }

    const runtimeState: BattleRuntimeState = {
      battleId,
      scenarioId: battle.scenarioId,
      currentTickIndex: 0,
      totalTicks: lockedTotalTicks,
      tickIntervalMs: lockedTickInterval,
      startingBalance: lockedStartingBalance,
      playerStates,
      isRunning: true,
      serverSeed,
      startedAt: new Date(),
    };

    this.activeBattles.set(battleId, runtimeState);

    // Cache initial state in Redis for reconnection
    await this.cacheRuntimeState(battleId, runtimeState);

    // Start countdown
    await this.runCountdown(battleId);
  }

  /**
   * Run countdown before battle starts
   */
  private async runCountdown(battleId: string): Promise<void> {
    const countdownSeconds = this.configService.battleCountdownSeconds;

    for (let i = countdownSeconds; i >= 0; i--) {
      await this.pubSub.publish(`${BATTLE_STATE}.${battleId}`, {
        battleState: {
          battleId,
          status: 'MATCHED',
          countdown: i,
          message: i > 0 ? `Battle starts in ${i}...` : 'GO!',
        },
      });

      if (i > 0) {
        await this.sleep(1000);
      }
    }

    // Update battle status to ACTIVE
    await this.battleService.updateStatus(battleId, 'ACTIVE' as any);

    // Publish ACTIVE state
    await this.pubSub.publish(`${BATTLE_STATE}.${battleId}`, {
      battleState: {
        battleId,
        status: 'ACTIVE',
        countdown: null,
        message: 'Battle in progress',
      },
    });

    // Start tick streaming
    this.startTickStreaming(battleId);
  }

  /**
   * Start streaming ticks for a battle
   * Server is the ONLY source of truth for ticks
   */
  private async startTickStreaming(battleId: string): Promise<void> {
    const state = this.activeBattles.get(battleId);
    if (!state) return;

    const scenario = await this.scenarioService.findByIdOrThrow(state.scenarioId);
    const ticks = this.scenarioService.getTicks(scenario);

    // Use locked interval from battle, not scenario
    const intervalMs = state.tickIntervalMs;

    const streamTick = async () => {
      const currentState = this.activeBattles.get(battleId);
      if (!currentState || !currentState.isRunning) {
        return;
      }

      const tickIndex = currentState.currentTickIndex;
      
      // Use locked totalTicks, not scenario ticks length
      if (tickIndex >= currentState.totalTicks || !ticks[tickIndex]) {
        await this.finishBattle(battleId);
        return;
      }

      const tick = ticks[tickIndex];
      const currentPrice = tick.close;

      // Calculate PnL for all players (SERVER-SIDE ONLY)
      const playerPnls: { oderId: string; pnl: number; position: string; side: string }[] = [];

      currentState.playerStates.forEach((playerState, oderId) => {
        // Server calculates unrealized PnL
        if (playerState.position === 'LONG') {
          playerState.unrealizedPnl = (currentPrice - playerState.entryPrice) * playerState.quantity;
        } else if (playerState.position === 'SHORT') {
          playerState.unrealizedPnl = (playerState.entryPrice - currentPrice) * playerState.quantity;
        } else {
          playerState.unrealizedPnl = 0;
        }

        const totalPnl = playerState.realizedPnl + playerState.unrealizedPnl;
        const pnlPercent = playerState.balance > 0 ? (totalPnl / playerState.balance) * 100 : 0;

        playerPnls.push({
          oderId,
          pnl: pnlPercent,
          position: playerState.position,
          side: playerState.side,
        });
      });

      // Server calculates time remaining
      const timeRemaining = (currentState.totalTicks - tickIndex - 1) * (intervalMs / 1000);

      const tickPayload = {
        battleId,
        tick: {
          ts: tick.ts,
          open: tick.open,
          high: tick.high,
          low: tick.low,
          close: tick.close,
          volume: tick.volume,
        },
        currentIndex: tickIndex,
        totalTicks: currentState.totalTicks,
        timeRemaining: Math.round(timeRemaining),
        players: playerPnls,
      };

      // Store tick in Redis for reconnection (only recent window)
      await this.redisService.addToTickWindow(battleId, tickPayload, TICK_WINDOW_SIZE);
      await this.redisService.setLastTick(battleId, tickIndex, tickPayload);

      // Publish tick
      await this.pubSub.publish(`${BATTLE_TICK}.${battleId}`, {
        battleTick: tickPayload,
      });

      // Update DB periodically (every 5 ticks)
      if (tickIndex % 5 === 0) {
        await this.prisma.battle.update({
          where: { id: battleId },
          data: { currentTickIndex: tickIndex },
        });
      }

      // Increment tick index
      currentState.currentTickIndex++;

      // Schedule next tick
      currentState.intervalId = setTimeout(streamTick, intervalMs);
    };

    streamTick();
  }

  /**
   * Process a player action with rate limiting and duplicate detection
   */
  async processAction(
    battleId: string,
    oderId: string,
    actionType: ActionTypeEnum,
    quantity: number,
  ): Promise<void> {
    const state = this.activeBattles.get(battleId);
    if (!state || !state.isRunning) {
      throw new BadRequestException('Battle is not running');
    }

    const playerState = state.playerStates.get(oderId);
    if (!playerState) {
      throw new ForbiddenException('You are not a participant in this battle');
    }

    // Rate limiting: max actions per second
    const withinLimit = await this.redisService.checkRateLimit(oderId, MAX_ACTIONS_PER_SECOND);
    if (!withinLimit) {
      throw new BadRequestException('Rate limit exceeded. Slow down.');
    }

    // Duplicate action detection (same tick, same action type)
    const isDuplicate = await this.redisService.checkDuplicateAction(
      battleId,
      oderId,
      state.currentTickIndex,
      actionType,
    );
    if (isDuplicate) {
      throw new BadRequestException('Duplicate action rejected');
    }

    // Check cooldown
    const canAct = await this.redisService.checkActionCooldown(battleId, oderId);
    if (!canAct) {
      throw new BadRequestException('Action cooldown active. Please wait.');
    }

    // Get current price from SERVER state (not client)
    const scenario = await this.scenarioService.findByIdOrThrow(state.scenarioId);
    const ticks = this.scenarioService.getTicks(scenario);
    const currentTick = ticks[state.currentTickIndex] || ticks[state.currentTickIndex - 1];

    if (!currentTick) {
      throw new BadRequestException('No price data available');
    }

    const currentPrice = currentTick.close;

    // Map ActionTypeEnum to Prisma ActionType
    let prismaActionType: ActionType;
    if (actionType === ActionTypeEnum.BUY) {
      prismaActionType = ActionType.BUY;
    } else if (actionType === ActionTypeEnum.SELL) {
      prismaActionType = ActionType.SELL;
    } else {
      prismaActionType = ActionType.CLOSE;
    }

    // Record action with SERVER timestamp and tick index
    await this.actionService.createAction({
      battleId,
      oderId,
      type: prismaActionType,
      quantity,
      price: currentPrice,
      tickIndex: state.currentTickIndex,
    });

    // Update player state (SERVER-SIDE)
    this.updatePlayerState(playerState, actionType, quantity, currentPrice);

    // Persist position to DB
    await this.prisma.battleParticipant.update({
      where: { id: playerState.participantId },
      data: {
        positionSize: playerState.position === 'LONG' ? playerState.quantity : 
                      playerState.position === 'SHORT' ? -playerState.quantity : 0,
        entryPrice: playerState.entryPrice || null,
        realizedPnl: playerState.realizedPnl,
        unrealizedPnl: playerState.unrealizedPnl,
      },
    });

    // Set cooldown
    await this.redisService.setActionCooldown(
      battleId,
      oderId,
      this.configService.actionCooldownMs,
    );
  }

  /**
   * Get current battle state for reconnection
   * Returns only current tick + recent window (NO FUTURE TICKS)
   */
  async getReconnectionState(battleId: string): Promise<{
    status: string;
    currentTickIndex: number;
    totalTicks: number;
    timeRemaining: number;
    recentTicks: any[];
    players: any[];
  } | null> {
    // Check in-memory state first
    const state = this.activeBattles.get(battleId);
    if (state && state.isRunning) {
      const recentTicks = await this.redisService.getTickWindow(battleId);
      
      const playerPnls: any[] = [];
      state.playerStates.forEach((ps, oderId) => {
        const totalPnl = ps.realizedPnl + ps.unrealizedPnl;
        const pnlPercent = ps.balance > 0 ? (totalPnl / ps.balance) * 100 : 0;
        playerPnls.push({
          oderId,
          pnl: pnlPercent,
          position: ps.position,
          side: ps.side,
        });
      });

      return {
        status: 'ACTIVE',
        currentTickIndex: state.currentTickIndex,
        totalTicks: state.totalTicks,
        timeRemaining: (state.totalTicks - state.currentTickIndex) * (state.tickIntervalMs / 1000),
        recentTicks,
        players: playerPnls,
      };
    }

    // Fallback to Redis cache
    const lastTick = await this.redisService.getLastTick(battleId);
    if (lastTick) {
      const recentTicks = await this.redisService.getTickWindow(battleId);
      return {
        status: 'ACTIVE',
        currentTickIndex: lastTick.tickIndex,
        totalTicks: lastTick.tick.totalTicks,
        timeRemaining: lastTick.tick.timeRemaining,
        recentTicks,
        players: lastTick.tick.players || [],
      };
    }

    return null;
  }

  /**
   * Update player state after an action
   */
  private updatePlayerState(
    state: PlayerState,
    actionType: ActionTypeEnum,
    quantity: number,
    price: number,
  ): void {
    if (actionType === ActionTypeEnum.CLOSE) {
      if (state.position === 'LONG') {
        const pnl = (price - state.entryPrice) * state.quantity;
        state.realizedPnl += pnl;
      } else if (state.position === 'SHORT') {
        const pnl = (state.entryPrice - price) * state.quantity;
        state.realizedPnl += pnl;
      }
      state.position = 'FLAT';
      state.entryPrice = 0;
      state.quantity = 0;
      state.unrealizedPnl = 0;
      return;
    }

    if (actionType === ActionTypeEnum.BUY) {
      if (state.position === 'SHORT') {
        const pnl = (state.entryPrice - price) * state.quantity;
        state.realizedPnl += pnl;
        state.position = 'FLAT';
        state.entryPrice = 0;
        state.quantity = 0;
        state.unrealizedPnl = 0;
      } else if (state.position === 'FLAT') {
        state.position = 'LONG';
        state.entryPrice = price;
        state.quantity = quantity;
      } else {
        const totalCost = state.entryPrice * state.quantity + price * quantity;
        const totalQuantity = state.quantity + quantity;
        state.entryPrice = totalCost / totalQuantity;
        state.quantity = totalQuantity;
      }
    } else if (actionType === ActionTypeEnum.SELL) {
      if (state.position === 'LONG') {
        const pnl = (price - state.entryPrice) * state.quantity;
        state.realizedPnl += pnl;
        state.position = 'FLAT';
        state.entryPrice = 0;
        state.quantity = 0;
        state.unrealizedPnl = 0;
      } else if (state.position === 'FLAT') {
        state.position = 'SHORT';
        state.entryPrice = price;
        state.quantity = quantity;
      } else {
        const totalCost = state.entryPrice * state.quantity + price * quantity;
        const totalQuantity = state.quantity + quantity;
        state.entryPrice = totalCost / totalQuantity;
        state.quantity = totalQuantity;
      }
    }
  }

  /**
   * Finish a battle and calculate results
   */
  private async finishBattle(battleId: string): Promise<void> {
    const state = this.activeBattles.get(battleId);
    if (!state) return;

    state.isRunning = false;
    if (state.intervalId) {
      clearTimeout(state.intervalId);
    }

    const scenario = await this.scenarioService.findByIdOrThrow(state.scenarioId);
    const ticks = this.scenarioService.getTicks(scenario);
    const finalTick = ticks[Math.min(state.totalTicks - 1, ticks.length - 1)];
    const finalPrice = finalTick?.close || 0;

    const battle = await this.battleService.findByIdOrThrow(battleId);
    const results: { oderId: string; finalPnl: number; side: ParticipantSide }[] = [];

    for (const participant of battle.participants) {
      const playerState = state.playerStates.get(participant.userId);
      if (!playerState) continue;

      let unrealizedPnl = 0;
      if (playerState.position === 'LONG') {
        unrealizedPnl = (finalPrice - playerState.entryPrice) * playerState.quantity;
      } else if (playerState.position === 'SHORT') {
        unrealizedPnl = (playerState.entryPrice - finalPrice) * playerState.quantity;
      }

      const startingBalance = state.startingBalance;
      const totalPnl = playerState.realizedPnl + unrealizedPnl;
      const pnlPercent = startingBalance > 0 ? (totalPnl / startingBalance) * 100 : 0;

      results.push({
        oderId: participant.userId,
        finalPnl: pnlPercent,
        side: participant.side,
      });

      await this.prisma.battleParticipant.update({
        where: { id: participant.id },
        data: {
          realizedPnl: playerState.realizedPnl + unrealizedPnl,
          unrealizedPnl: 0,
          positionSize: 0,
          currentBalance: startingBalance + totalPnl,
        },
      });
    }

    const playerA = results.find((r) => r.side === ParticipantSide.A);
    const playerB = results.find((r) => r.side === ParticipantSide.B);

    let winnerUserId: string | null = null;
    let isDraw = false;

    if (playerA && playerB) {
      if (playerA.finalPnl > playerB.finalPnl) {
        winnerUserId = playerA.oderId;
      } else if (playerB.finalPnl > playerA.finalPnl) {
        winnerUserId = playerB.oderId;
      } else {
        isDraw = true;
      }
    }

    await this.prisma.battleResult.create({
      data: {
        battleId,
        winnerUserId,
        pnlA: playerA?.finalPnl || 0,
        pnlB: playerB?.finalPnl || 0,
      },
    });

    await this.battleService.updateStatus(battleId, 'FINISHED' as any);

    const pointsA = playerA
      ? await this.pointsService.awardBattlePoints(
          playerA.oderId,
          battleId,
          winnerUserId === playerA.oderId,
          isDraw,
          playerA.finalPnl,
        )
      : 0;

    const pointsB = playerB
      ? await this.pointsService.awardBattlePoints(
          playerB.oderId,
          battleId,
          winnerUserId === playerB.oderId,
          isDraw,
          playerB.finalPnl,
        )
      : 0;

    await this.pubSub.publish(`${BATTLE_STATE}.${battleId}`, {
      battleState: {
        battleId,
        status: 'FINISHED',
        countdown: null,
        message: isDraw ? 'Battle ended in a draw!' : 'Battle finished!',
      },
    });

    let winnerUser: { id: string; address: string; createdAt: Date } | undefined;
    if (winnerUserId) {
      const user = await this.prisma.user.findUnique({ where: { id: winnerUserId } });
      if (user) {
        winnerUser = { id: user.id, address: user.address, createdAt: user.createdAt };
      }
    }

    await this.pubSub.publish(`${BATTLE_RESULT}.${battleId}`, {
      battleResult: {
        battleId,
        winner: winnerUser,
        isDraw,
        pnlA: playerA?.finalPnl || 0,
        pnlB: playerB?.finalPnl || 0,
        pointsA,
        pointsB,
        scenarioId: state.scenarioId,
        revealSalt: battle.revealSalt,
        finalizedAt: new Date(),
      },
    });

    // Cleanup Redis
    await this.redisService.deleteBattleState(battleId);
    this.activeBattles.delete(battleId);
  }

  /**
   * Cache runtime state in Redis for reconnection
   */
  private async cacheRuntimeState(battleId: string, state: BattleRuntimeState): Promise<void> {
    const playerStatesObj: Record<string, any> = {};
    state.playerStates.forEach((ps, oderId) => {
      playerStatesObj[oderId] = ps;
    });

    await this.redisService.setBattleState(battleId, {
      battleId: state.battleId,
      scenarioId: state.scenarioId,
      currentTickIndex: state.currentTickIndex,
      totalTicks: state.totalTicks,
      tickIntervalMs: state.tickIntervalMs,
      startingBalance: state.startingBalance,
      serverSeed: state.serverSeed,
      startedAt: state.startedAt.toISOString(),
      playerStates: playerStatesObj,
    });
  }

  isActive(battleId: string): boolean {
    return this.activeBattles.has(battleId);
  }

  getCurrentTickIndex(battleId: string): number {
    const state = this.activeBattles.get(battleId);
    return state?.currentTickIndex || 0;
  }

  getPlayerState(battleId: string, oderId: string): PlayerState | undefined {
    const state = this.activeBattles.get(battleId);
    return state?.playerStates.get(oderId);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
