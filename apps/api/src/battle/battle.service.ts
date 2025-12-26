import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScenarioService } from '../scenario/scenario.service';
import { UserService } from '../user/user.service';
import { generateSalt, generateCommitHash } from '../common/utils/hash.util';
import { Battle, BattleParticipant, BattleStatus, ParticipantSide } from '@prisma/client';

export interface BattleWithParticipants extends Battle {
  participants: (BattleParticipant & { user: { id: string; address: string; createdAt: Date } })[];
  scenario?: { asset: string; timeframe: string };
}

@Injectable()
export class BattleService {
  constructor(
    private prisma: PrismaService,
    private scenarioService: ScenarioService,
    private userService: UserService,
  ) {}

  async findById(id: string): Promise<BattleWithParticipants | null> {
    return this.prisma.battle.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
        scenario: {
          select: {
            asset: true,
            timeframe: true,
          },
        },
      },
    });
  }

  async findByIdOrThrow(id: string): Promise<BattleWithParticipants> {
    const battle = await this.findById(id);
    if (!battle) {
      throw new NotFoundException(`Battle with ID ${id} not found`);
    }
    return battle;
  }

  async findMany(options: {
    status?: BattleStatus;
    userId?: string;
    cursor?: string;
    take?: number;
  }): Promise<{ battles: BattleWithParticipants[]; nextCursor?: string; hasMore: boolean }> {
    const take = options.take || 20;

    const where: {
      status?: BattleStatus;
      participants?: { some: { userId: string } };
    } = {};

    if (options.status) {
      where.status = options.status;
    }

    if (options.userId) {
      where.participants = {
        some: { userId: options.userId },
      };
    }

    const battles = await this.prisma.battle.findMany({
      where,
      include: {
        participants: {
          include: {
            user: true,
          },
        },
        scenario: {
          select: {
            asset: true,
            timeframe: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      cursor: options.cursor ? { id: options.cursor } : undefined,
      skip: options.cursor ? 1 : 0,
    });

    const hasMore = battles.length > take;
    const resultBattles = hasMore ? battles.slice(0, -1) : battles;
    const nextCursor = hasMore ? resultBattles[resultBattles.length - 1]?.id : undefined;

    return { battles: resultBattles, nextCursor, hasMore };
  }

  async createBattle(
    userId: string,
    startingBalance: number = 10000,
    scenarioId?: string,
    userAddress?: string,
  ): Promise<BattleWithParticipants> {
    // Ensure user exists (for dev auth support)
    if (userAddress) {
      await this.userService.ensureDevUser(userId, userAddress);
    }

    // Select scenario (specific or random)
    let scenario;
    if (scenarioId) {
      scenario = await this.scenarioService.findByIdOrThrow(scenarioId);
    } else {
      scenario = await this.scenarioService.getRandomScenario();
    }

    // Generate commit hash for provably fair
    const salt = generateSalt();
    const commitHash = generateCommitHash(scenario.id, salt);

    // Create battle and first participant in a transaction
    const battle = await this.prisma.battle.create({
      data: {
        scenarioId: scenario.id,
        commitHash,
        revealSalt: salt, // Stored but not exposed until battle ends
        status: BattleStatus.WAITING,
        participants: {
          create: {
            userId,
            side: ParticipantSide.A,
            startingBalance,
            currentBalance: startingBalance,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
        scenario: {
          select: {
            asset: true,
            timeframe: true,
          },
        },
      },
    });

    return battle;
  }

  async joinBattle(battleId: string, userId: string, userAddress?: string): Promise<BattleWithParticipants> {
    // Ensure user exists (for dev auth support)
    if (userAddress) {
      await this.userService.ensureDevUser(userId, userAddress);
    }

    const battle = await this.findByIdOrThrow(battleId);

    if (battle.status !== BattleStatus.WAITING) {
      throw new BadRequestException('Battle is not waiting for players');
    }

    // Check if user is already a participant
    const existingParticipant = battle.participants.find((p) => p.userId === userId);
    if (existingParticipant) {
      throw new BadRequestException('You are already a participant in this battle');
    }

    // Check if battle already has 2 participants
    if (battle.participants.length >= 2) {
      throw new BadRequestException('Battle is full');
    }

    // Get starting balance from first participant
    const creatorParticipant = battle.participants.find((p) => p.side === ParticipantSide.A);
    const startingBalance = creatorParticipant?.startingBalance || 10000;

    // Join the battle
    const updatedBattle = await this.prisma.battle.update({
      where: { id: battleId },
      data: {
        status: BattleStatus.MATCHED,
        matchedAt: new Date(),
        participants: {
          create: {
            userId,
            side: ParticipantSide.B,
            startingBalance: Number(startingBalance),
            currentBalance: Number(startingBalance),
          },
        },
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
        scenario: {
          select: {
            asset: true,
            timeframe: true,
          },
        },
      },
    });

    return updatedBattle;
  }

  async updateStatus(battleId: string, status: BattleStatus): Promise<Battle> {
    const updateData: { status: BattleStatus; startedAt?: Date; finishedAt?: Date } = { status };

    if (status === BattleStatus.ACTIVE) {
      updateData.startedAt = new Date();
    } else if (status === BattleStatus.FINISHED) {
      updateData.finishedAt = new Date();
    }

    return this.prisma.battle.update({
      where: { id: battleId },
      data: updateData,
    });
  }

  async getParticipant(battleId: string, userId: string): Promise<BattleParticipant | null> {
    return this.prisma.battleParticipant.findUnique({
      where: {
        battleId_userId: {
          battleId,
          userId,
        },
      },
    });
  }

  async updateParticipantBalance(participantId: string, newBalance: number): Promise<void> {
    await this.prisma.battleParticipant.update({
      where: { id: participantId },
      data: { currentBalance: newBalance },
    });
  }

  async getWaitingBattles(): Promise<BattleWithParticipants[]> {
    const result = await this.findMany({ status: BattleStatus.WAITING });
    return result.battles;
  }

  async cancelBattle(battleId: string, userId: string): Promise<Battle> {
    const battle = await this.findByIdOrThrow(battleId);

    // Only creator can cancel
    const creatorParticipant = battle.participants.find((p) => p.side === ParticipantSide.A);
    if (creatorParticipant?.userId !== userId) {
      throw new ForbiddenException('Only the battle creator can cancel');
    }

    // Can only cancel if WAITING
    if (battle.status !== BattleStatus.WAITING) {
      throw new BadRequestException('Can only cancel battles in WAITING status');
    }

    return this.updateStatus(battleId, BattleStatus.CANCELED);
  }
}
