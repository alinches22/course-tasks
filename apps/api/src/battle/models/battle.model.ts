import { ObjectType, Field, ID } from '@nestjs/graphql';
import { BattleStatusEnum, ParticipantSideEnum } from '../enums/battle-status.enum';
import { UserModel } from '../../user/models/user.model';

@ObjectType()
export class BattleParticipantModel {
  @Field(() => ID)
  id: string;

  @Field(() => ParticipantSideEnum)
  side: ParticipantSideEnum;

  @Field(() => UserModel)
  user: UserModel;

  @Field(() => Number)
  startingBalance: number;

  @Field(() => Number)
  currentBalance: number;

  @Field(() => Date)
  createdAt: Date;
}

@ObjectType()
export class BattleModel {
  @Field(() => ID)
  id: string;

  @Field(() => BattleStatusEnum)
  status: BattleStatusEnum;

  @Field(() => String)
  commitHash: string;

  @Field(() => String, { nullable: true })
  revealSalt?: string;

  @Field(() => String, { nullable: true })
  scenarioId?: string;

  @Field(() => String, { nullable: true })
  asset?: string;

  @Field(() => String, { nullable: true })
  timeframe?: string;

  @Field(() => [BattleParticipantModel])
  participants: BattleParticipantModel[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date, { nullable: true })
  matchedAt?: Date;

  @Field(() => Date, { nullable: true })
  startedAt?: Date;

  @Field(() => Date, { nullable: true })
  finishedAt?: Date;
}

@ObjectType()
export class BattleListModel {
  @Field(() => [BattleModel])
  battles: BattleModel[];

  @Field(() => String, { nullable: true })
  nextCursor?: string;

  @Field(() => Boolean)
  hasMore: boolean;
}
