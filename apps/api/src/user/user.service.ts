import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Ensure a dev user exists - creates if not found
   */
  async ensureDevUser(userId: string, address: string): Promise<User> {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (existing) {
      return existing;
    }

    // Also check by address
    const byAddress = await this.prisma.user.findUnique({
      where: { address: address.toLowerCase() },
    });

    if (byAddress) {
      return byAddress;
    }

    // Create new dev user
    return this.prisma.user.create({
      data: {
        id: userId,
        address: address.toLowerCase(),
      },
    });
  }

  async findByIdOrThrow(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByAddress(address: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { address: address.toLowerCase() },
    });
  }

  async getStats(userId: string) {
    const [totalBattles, wins, losses, draws, totalPoints, weeklyPoints] = await Promise.all([
      // Total battles
      this.prisma.battleParticipant.count({
        where: { userId },
      }),
      // Wins
      this.prisma.battleResult.count({
        where: { winnerUserId: userId },
      }),
      // Losses (battles where user participated but someone else won)
      this.prisma.battleResult.count({
        where: {
          AND: [
            { winnerUserId: { not: userId } },
            { winnerUserId: { not: null } },
            {
              battle: {
                participants: {
                  some: { userId },
                },
              },
            },
          ],
        },
      }),
      // Draws
      this.prisma.battleResult.count({
        where: {
          AND: [
            { winnerUserId: null },
            {
              battle: {
                participants: {
                  some: { userId },
                },
              },
            },
          ],
        },
      }),
      // Total points
      this.prisma.pointsLedger.aggregate({
        where: { userId },
        _sum: { points: true },
      }),
      // Weekly points (last 7 days)
      this.prisma.pointsLedger.aggregate({
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        _sum: { points: true },
      }),
    ]);

    const winRate = totalBattles > 0 ? (wins / totalBattles) * 100 : 0;

    return {
      userId,
      totalBattles,
      wins,
      losses,
      draws,
      winRate,
      totalPoints: totalPoints._sum.points || 0,
      weeklyPoints: weeklyPoints._sum.points || 0,
    };
  }
}
