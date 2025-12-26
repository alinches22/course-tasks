import { Module } from '@nestjs/common';
import { ReplayService } from './replay.service';
import { ReplayResolver } from './replay.resolver';
import { ScenarioModule } from '../scenario/scenario.module';
import { ActionModule } from '../action/action.module';

@Module({
  imports: [ScenarioModule, ActionModule],
  providers: [ReplayService, ReplayResolver],
  exports: [ReplayService],
})
export class ReplayModule {}
