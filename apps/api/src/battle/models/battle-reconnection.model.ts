import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { BattleTickModel, PlayerTickState } from './battle-tick.model';

@ObjectType()
export class BattleReconnectionModel {
  @Field(() => ID)
  battleId: string;

  @Field(() => String)
  status: string;

  @Field(() => Int)
  currentTickIndex: number;

  @Field(() => Int)
  totalTicks: number;

  @Field(() => Int)
  timeRemaining: number;

  @Field(() => [BattleTickModel])
  recentTicks: BattleTickModel[];

  @Field(() => [PlayerTickState])
  players: PlayerTickState[];
}
