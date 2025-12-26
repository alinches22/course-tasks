import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ScenarioService } from './scenario.service';
import { ScenarioModel, ScenarioDetailModel } from './models/scenario.model';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@Resolver(() => ScenarioModel)
@UseGuards(JwtAuthGuard)
export class ScenarioResolver {
  constructor(private scenarioService: ScenarioService) {}

  @Query(() => [ScenarioModel], { description: 'List all available scenarios' })
  @Public()
  async scenarios(): Promise<ScenarioModel[]> {
    const scenarios = await this.scenarioService.findAll();
    return scenarios.map((s) => this.mapScenario(s));
  }

  @Query(() => ScenarioDetailModel, { description: 'Get scenario by ID with ticks', nullable: true })
  async scenario(@Args('id', { type: () => ID }) id: string): Promise<ScenarioDetailModel | null> {
    const scenario = await this.scenarioService.findById(id);
    if (!scenario) return null;

    const ticks = this.scenarioService.getTicks(scenario);
    const metadata = this.scenarioService.getMetadata(scenario);

    return {
      id: scenario.id,
      symbol: (scenario as any).symbol || scenario.asset,
      asset: scenario.asset,
      timeframe: scenario.timeframe,
      tickIntervalMs: (scenario as any).tickIntervalMs || 2000,
      tickCount: ticks.length,
      metadata: metadata || undefined,
      createdAt: scenario.createdAt,
      ticks,
    };
  }

  private mapScenario(scenario: any): ScenarioModel {
    const ticks = this.scenarioService.getTicks(scenario);
    const metadata = this.scenarioService.getMetadata(scenario);

    return {
      id: scenario.id,
      symbol: scenario.symbol || scenario.asset,
      asset: scenario.asset,
      timeframe: scenario.timeframe,
      tickIntervalMs: scenario.tickIntervalMs || 2000,
      tickCount: ticks.length,
      metadata: metadata || undefined,
      createdAt: scenario.createdAt,
    };
  }
}
