import { Module } from '@nestjs/common';
import { ScenarioService } from './scenario.service';
import { ScenarioResolver } from './scenario.resolver';

@Module({
  providers: [ScenarioService, ScenarioResolver],
  exports: [ScenarioService],
})
export class ScenarioModule {}
