import { Module } from '@nestjs/common';
import { BattleService } from './battle.service';
import { BattleResolver } from './battle.resolver';
import { BattleEngineService } from './battle-engine.service';
import { TickStreamerService } from './tick-streamer.service';
import { ScenarioModule } from '../scenario/scenario.module';
import { ActionModule } from '../action/action.module';
import { PointsModule } from '../points/points.module';
import { UserModule } from '../user/user.module';
import { PubSubProvider } from '../graphql/pubsub.provider';

@Module({
  imports: [ScenarioModule, ActionModule, PointsModule, UserModule],
  providers: [
    BattleService,
    BattleResolver,
    BattleEngineService,
    TickStreamerService,
    PubSubProvider,
  ],
  exports: [BattleService, BattleEngineService],
})
export class BattleModule {}
