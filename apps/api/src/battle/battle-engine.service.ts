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
import { BattleStatus, ActionType, ParticipantSide } from '@prisma/client';
import { ActionTypeEnum } from './enums/battle-status.enum';

interface PlayerState {
  oderId: string;
  position: 'LONG' | 'SHORT' | 'FLAT';
  entryPrice: number;
  quantity: number;
  realizedPnl: number;
  balance: number;
}

interface BattleRuntimeState {
  battleId: string;
  scenarioId: string;
  currentTickIndex: number;
  totalTicks: number;
  playerStates: Map<string, PlayerState>;
  isRunning: boolean;
  intervalId?: NodeJS.Timeout;
}

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
   */
  async startBattle(battleId: string): Promise<void> {
    const battle = await this.battleService.findByIdOrThrow(battleId);

    if (battle.status !== BattleStatus.MATCHED) {
      throw new BadRequestException('Battle must be in MATCHED status to start');
    }

    const scenario = await this.scenarioService.findByIdOrThrow(battle.scenarioId);
    const ticks = this.scenarioService.getTicks(scenario);

    // Initialize player states
    const playerStates = new Map<string, PlayerState>();
    for (const participant of battle.participants) {
      playerStates.set(participant.userId, {
        oderId: participant.id,
        position: 'FLAT',
        entryPrice: 0,
        quantity: 0,
        realizedPnl: 0,
        balance: Number(participant.startingBalance),
      });
    }

    const runtimeState: BattleRuntimeState = {
      battleId,
      scenarioId: scenario.id,
      currentTickIndex: 0,
      totalTicks: ticks.length,
      playerStates,
      isRunning: true,
    };

    this.activeBattles.set(battleId, runtimeState);

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

    // Update battle status to RUNNING
    await this.battleService.updateStatus(battleId, BattleStatus.RUNNING);

    // Publish RUNNING state
    await this.pubSub.publish(`${BATTLE_STATE}.${battleId}`, {
      battleState: {
        battleId,
        status: 'RUNNING',
        countdown: null,
        message: 'Battle in progress',
      },
    });

    // Start tick streaming
    this.startTickStreaming(battleId);
  }

  /**
   * Start streaming ticks for a battle
   */
  private async startTickStreaming(battleId: string): Promise<void> {
    const state = this.activeBattles.get(battleId);
    if (!state) return;

    const scenario = await this.scenarioService.findByIdOrThrow(state.scenarioId);
    const ticks = this.scenarioService.getTicks(scenario);

    const intervalMs = this.configService.battleTickIntervalMs;

    const streamTick = async () => {
      const currentState = this.activeBattles.get(battleId);
      if (!currentState || !currentState.isRunning) {
        return;
      }

      const tickIndex = currentState.currentTickIndex;
      const tick = ticks[tickIndex];

      if (!tick) {
        // Battle finished - all ticks sent
        await this.finishBattle(battleId);
        return;
      }

      const timeRemaining = (ticks.length - tickIndex - 1) * (intervalMs / 1000);

      // Publish tick
      await this.pubSub.publish(`${BATTLE_TICK}.${battleId}`, {
        battleTick: {
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
          totalTicks: ticks.length,
          timeRemaining: Math.round(timeRemaining),
        },
      });

      // Increment tick index
      currentState.currentTickIndex++;

      // Schedule next tick
      currentState.intervalId = setTimeout(streamTick, intervalMs);
    };

    // Start streaming
    streamTick();
  }

  /**
   * Process a player action (BUY/SELL)
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

    // Check cooldown
    const canAct = await this.redisService.checkActionCooldown(battleId, oderId);
    if (!canAct) {
      throw new BadRequestException('Action cooldown active. Please wait.');
    }

    // Get current price from latest tick
    const scenario = await this.scenarioService.findByIdOrThrow(state.scenarioId);
    const ticks = this.scenarioService.getTicks(scenario);
    const currentTick = ticks[state.currentTickIndex] || ticks[state.currentTickIndex - 1];

    if (!currentTick) {
      throw new BadRequestException('No price data available');
    }

    const currentPrice = currentTick.close;

    // Record the action
    await this.actionService.createAction({
      battleId,
      oderId,
      type: actionType === ActionTypeEnum.BUY ? ActionType.BUY : ActionType.SELL,
      quantity,
      price: currentPrice,
      tickIndex: state.currentTickIndex,
    });

    // Update player state based on action
    this.updatePlayerState(playerState, actionType, quantity, currentPrice);

    // Set cooldown
    await this.redisService.setActionCooldown(
      battleId,
      oderId,
      this.configService.actionCooldownMs,
    );
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
    if (actionType === ActionTypeEnum.BUY) {
      if (state.position === 'SHORT') {
        // Close short position
        const pnl = (state.entryPrice - price) * state.quantity;
        state.realizedPnl += pnl;
        state.balance += pnl;
        state.position = 'FLAT';
        state.entryPrice = 0;
        state.quantity = 0;
      } else if (state.position === 'FLAT') {
        // Open long position
        state.position = 'LONG';
        state.entryPrice = price;
        state.quantity = quantity;
      } else {
        // Add to long position (average entry)
        const totalCost = state.entryPrice * state.quantity + price * quantity;
        const totalQuantity = state.quantity + quantity;
        state.entryPrice = totalCost / totalQuantity;
        state.quantity = totalQuantity;
      }
    } else {
      // SELL
      if (state.position === 'LONG') {
        // Close long position
        const pnl = (price - state.entryPrice) * state.quantity;
        state.realizedPnl += pnl;
        state.balance += pnl;
        state.position = 'FLAT';
        state.entryPrice = 0;
        state.quantity = 0;
      } else if (state.position === 'FLAT') {
        // Open short position
        state.position = 'SHORT';
        state.entryPrice = price;
        state.quantity = quantity;
      } else {
        // Add to short position (average entry)
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

    // Stop streaming
    state.isRunning = false;
    if (state.intervalId) {
      clearTimeout(state.intervalId);
    }

    // Get final prices for unrealized PnL
    const scenario = await this.scenarioService.findByIdOrThrow(state.scenarioId);
    const ticks = this.scenarioService.getTicks(scenario);
    const finalTick = ticks[ticks.length - 1];
    const finalPrice = finalTick?.close || 0;

    // Calculate final PnL for each player
    const battle = await this.battleService.findByIdOrThrow(battleId);
    const results: { oderId: string; finalPnl: number; side: ParticipantSide }[] = [];

    for (const participant of battle.participants) {
      const playerState = state.playerStates.get(participant.userId);
      if (!playerState) continue;

      // Calculate unrealized PnL
      let unrealizedPnl = 0;
      if (playerState.position === 'LONG') {
        unrealizedPnl = (finalPrice - playerState.entryPrice) * playerState.quantity;
      } else if (playerState.position === 'SHORT') {
        unrealizedPnl = (playerState.entryPrice - finalPrice) * playerState.quantity;
      }

      const startingBalance = Number(participant.startingBalance);
      const totalPnl = playerState.realizedPnl + unrealizedPnl;
      const pnlPercent = startingBalance > 0 ? (totalPnl / startingBalance) * 100 : 0;

      results.push({
        oderId: participant.userId,
        finalPnl: pnlPercent,
        side: participant.side,
      });
    }

    // Determine winner
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

    // Save result
    await this.prisma.battleResult.create({
      data: {
        battleId,
        winnerUserId,
        pnlA: playerA?.finalPnl || 0,
        pnlB: playerB?.finalPnl || 0,
      },
    });

    // Update battle status
    await this.battleService.updateStatus(battleId, BattleStatus.FINISHED);

    // Award points
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

    // Publish state change
    await this.pubSub.publish(`${BATTLE_STATE}.${battleId}`, {
      battleState: {
        battleId,
        status: 'FINISHED',
        countdown: null,
        message: isDraw ? 'Battle ended in a draw!' : 'Battle finished!',
      },
    });

    // Get winner user info
    let winnerUser: { id: string; address: string; createdAt: Date } | undefined;
    if (winnerUserId) {
      const user = await this.prisma.user.findUnique({ where: { id: winnerUserId } });
      if (user) {
        winnerUser = { id: user.id, address: user.address, createdAt: user.createdAt };
      }
    }

    // Publish result
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

    // Cleanup
    this.activeBattles.delete(battleId);
  }

  /**
   * Check if a battle is active
   */
  isActive(battleId: string): boolean {
    return this.activeBattles.has(battleId);
  }

  /**
   * Get current tick index for a battle
   */
  getCurrentTickIndex(battleId: string): number {
    const state = this.activeBattles.get(battleId);
    return state?.currentTickIndex || 0;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
