import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class TickDataModel {
  @Field(() => Number)
  ts: number;

  @Field(() => Number)
  open: number;

  @Field(() => Number)
  high: number;

  @Field(() => Number)
  low: number;

  @Field(() => Number)
  close: number;

  @Field(() => Number)
  volume: number;
}

@ObjectType()
export class BattleTickModel {
  @Field(() => ID)
  battleId: string;

  @Field(() => TickDataModel)
  tick: TickDataModel;

  @Field(() => Int)
  currentIndex: number;

  @Field(() => Int)
  totalTicks: number;

  @Field(() => Int)
  timeRemaining: number;
}
