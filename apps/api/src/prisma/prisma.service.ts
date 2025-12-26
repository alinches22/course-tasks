import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    // Delete in order respecting foreign keys
    await this.$transaction([
      this.pointsLedger.deleteMany(),
      this.battleResult.deleteMany(),
      this.action.deleteMany(),
      this.battleParticipant.deleteMany(),
      this.battle.deleteMany(),
      this.weeklyPool.deleteMany(),
      this.nonce.deleteMany(),
      this.user.deleteMany(),
      this.scenario.deleteMany(),
    ]);
  }
}
