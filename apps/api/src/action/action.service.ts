import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Action, ActionType } from '@prisma/client';

export interface CreateActionDto {
  battleId: string;
  oderId: string;
  type: ActionType;
  quantity: number;
  price: number;
  tickIndex: number;
}

@Injectable()
export class ActionService {
  constructor(private prisma: PrismaService) {}

  async createAction(data: CreateActionDto): Promise<Action> {
    return this.prisma.action.create({
      data: {
        battleId: data.battleId,
        userId: data.oderId,
        type: data.type,
        quantity: data.quantity,
        price: data.price,
        tickIndex: data.tickIndex,
        serverTs: new Date(),
      },
    });
  }

  async getActionsForBattle(battleId: string): Promise<Action[]> {
    return this.prisma.action.findMany({
      where: { battleId },
      orderBy: { serverTs: 'asc' },
    });
  }

  async getActionsForUser(battleId: string, userId: string): Promise<Action[]> {
    return this.prisma.action.findMany({
      where: { battleId, userId },
      orderBy: { serverTs: 'asc' },
    });
  }

  async getActionCount(battleId: string, userId: string): Promise<number> {
    return this.prisma.action.count({
      where: { battleId, userId },
    });
  }

  async getLastAction(battleId: string, userId: string): Promise<Action | null> {
    return this.prisma.action.findFirst({
      where: { battleId, userId },
      orderBy: { serverTs: 'desc' },
    });
  }
}
