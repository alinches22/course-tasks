import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { TickDataModel } from '../../battle/models/battle-tick.model';

@ObjectType()
export class ReplayActionModel {
  @Field(() => ID)
  userId: string;

  @Field(() => String)
  type: string;

  @Field(() => Number)
  quantity: number;

  @Field(() => Number)
  price: number;

  @Field(() => Int)
  tickIndex: number;

  @Field(() => Date)
  serverTs: Date;
}

@ObjectType()
export class ReplayParticipantModel {
  @Field(() => ID)
  userId: string;

  @Field(() => String)
  address: string;

  @Field(() => String)
  side: string;

  @Field(() => Number)
  startingBalance: number;

  @Field(() => Number)
  finalPnl: number;
}

@ObjectType()
export class ReplayResultModel {
  @Field(() => ID, { nullable: true })
  winnerId?: string;

  @Field(() => Boolean)
  isDraw: boolean;

  @Field(() => Number)
  pnlA: number;

  @Field(() => Number)
  pnlB: number;

  @Field(() => Date)
  finalizedAt: Date;
}

@ObjectType()
export class ReplayVerificationModel {
  @Field(() => ID)
  scenarioId: string;

  @Field(() => String)
  revealSalt: string;

  @Field(() => String)
  commitHash: string;

  @Field(() => Boolean)
  isValid: boolean;
}

@ObjectType()
export class ReplayModel {
  @Field(() => ID)
  battleId: string;

  @Field(() => String)
  asset: string;

  @Field(() => String)
  timeframe: string;

  @Field(() => [TickDataModel])
  ticks: TickDataModel[];

  @Field(() => [ReplayActionModel])
  actions: ReplayActionModel[];

  @Field(() => [ReplayParticipantModel])
  participants: ReplayParticipantModel[];

  @Field(() => ReplayResultModel)
  result: ReplayResultModel;

  @Field(() => ReplayVerificationModel)
  verification: ReplayVerificationModel;
}
