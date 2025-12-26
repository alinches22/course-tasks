import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Scenario } from '@prisma/client';

export interface Tick {
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ScenarioMetadata {
  name: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  startDate: string;
  endDate: string;
}

@Injectable()
export class ScenarioService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Scenario | null> {
    return this.prisma.scenario.findUnique({
      where: { id },
    });
  }

  async findByIdOrThrow(id: string): Promise<Scenario> {
    const scenario = await this.findById(id);
    if (!scenario) {
      throw new NotFoundException(`Scenario with ID ${id} not found`);
    }
    return scenario;
  }

  async findAll(): Promise<Scenario[]> {
    return this.prisma.scenario.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRandomScenario(): Promise<Scenario> {
    const scenarios = await this.prisma.scenario.findMany();

    if (scenarios.length === 0) {
      throw new NotFoundException('No scenarios available');
    }

    const randomIndex = Math.floor(Math.random() * scenarios.length);
    return scenarios[randomIndex]!;
  }

  /**
   * Get ticks for a scenario
   */
  getTicks(scenario: Scenario): Tick[] {
    return scenario.ticks as unknown as Tick[];
  }

  /**
   * Get tick at specific index
   */
  getTickAtIndex(scenario: Scenario, index: number): Tick | null {
    const ticks = this.getTicks(scenario);
    return ticks[index] || null;
  }

  /**
   * Get scenario metadata
   */
  getMetadata(scenario: Scenario): ScenarioMetadata | null {
    return scenario.metadata as ScenarioMetadata | null;
  }

  /**
   * Get total tick count
   */
  getTickCount(scenario: Scenario): number {
    return this.getTicks(scenario).length;
  }
}
