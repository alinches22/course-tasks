import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScenarioService, Tick } from '../scenario/scenario.service';
import { BattleStatus } from '@prisma/client';
import { verifyCommitHash } from '../common/utils/hash.util';

export interface ReplayData {
  battleId: string;
  asset: string;
  timeframe: string;
  ticks: Tick[];
  actions: {
    userId: string;
    type: string;
    quantity: number;
    price: number;
    tickIndex: number;
    serverTs: Date;
  }[];
  participants: {
    userId: string;
    address: string;
    side: string;
    startingBalance: number;
    finalPnl: number;
  }[];
  result: {
    winnerId: string | null;
    isDraw: boolean;
    pnlA: number;
    pnlB: number;
    finalizedAt: Date;
  };
  verification: {
    scenarioId: string;
    revealSalt: string;
    commitHash: string;
    isValid: boolean;
  };
}

@Injectable()
export class ReplayService {
  constructor(
    private prisma: PrismaService,
    private scenarioService: ScenarioService,
  ) {}

  async getReplay(battleId: string): Promise<ReplayData> {
    // Get battle with all relations
    const battle = await this.prisma.battle.findUnique({
      where: { id: battleId },
      include: {
        scenario: true,
        participants: {
          include: {
            user: true,
          },
        },
        result: true,
        actions: {
          orderBy: { serverTs: 'asc' },
        },
      },
    });

    if (!battle) {
      throw new NotFoundException(`Battle with ID ${battleId} not found`);
    }

    if (battle.status !== BattleStatus.FINISHED) {
      throw new BadRequestException('Replay is only available for finished battles');
    }

    if (!battle.result) {
      throw new NotFoundException('Battle result not found');
    }

    // Verify commit hash
    const isValid = verifyCommitHash(
      battle.scenarioId,
      battle.revealSalt || '',
      battle.commitHash,
    );

    // Get ticks
    const ticks = this.scenarioService.getTicks(battle.scenario);

    // Map participants with final PnL
    const participants = battle.participants.map((p) => ({
      userId: p.userId,
      address: p.user.address,
      side: p.side,
      startingBalance: Number(p.startingBalance),
      finalPnl: p.side === 'A' ? Number(battle.result!.pnlA) : Number(battle.result!.pnlB),
    }));

    // Map actions
    const actions = battle.actions.map((a) => ({
      userId: a.userId,
      type: a.type,
      quantity: Number(a.quantity),
      price: Number(a.price),
      tickIndex: a.tickIndex,
      serverTs: a.serverTs,
    }));

    return {
      battleId: battle.id,
      asset: battle.scenario.asset,
      timeframe: battle.scenario.timeframe,
      ticks,
      actions,
      participants,
      result: {
        winnerId: battle.result.winnerUserId,
        isDraw: battle.result.winnerUserId === null,
        pnlA: Number(battle.result.pnlA),
        pnlB: Number(battle.result.pnlB),
        finalizedAt: battle.result.finalizedAt,
      },
      verification: {
        scenarioId: battle.scenarioId,
        revealSalt: battle.revealSalt || '',
        commitHash: battle.commitHash,
        isValid,
      },
    };
  }
}
