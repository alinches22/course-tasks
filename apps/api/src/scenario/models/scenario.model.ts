import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class TickModel {
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
export class ScenarioMetadataModel {
  @Field(() => String)
  name: string;

  @Field(() => String)
  description: string;

  @Field(() => String)
  difficulty: string;

  @Field(() => String)
  startDate: string;

  @Field(() => String)
  endDate: string;
}

@ObjectType()
export class ScenarioModel {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  asset: string;

  @Field(() => String)
  timeframe: string;

  @Field(() => Int)
  tickCount: number;

  @Field(() => ScenarioMetadataModel, { nullable: true })
  metadata?: ScenarioMetadataModel;

  @Field(() => Date)
  createdAt: Date;
}

@ObjectType()
export class ScenarioDetailModel extends ScenarioModel {
  @Field(() => [TickModel])
  ticks: TickModel[];
}
