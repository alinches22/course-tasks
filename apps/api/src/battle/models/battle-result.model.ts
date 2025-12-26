import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { UserModel } from '../../user/models/user.model';

@ObjectType()
export class BattleResultModel {
  @Field(() => ID)
  battleId: string;

  @Field(() => UserModel, { nullable: true })
  winner?: UserModel;

  @Field(() => Boolean)
  isDraw: boolean;

  @Field(() => Number)
  pnlA: number;

  @Field(() => Number)
  pnlB: number;

  @Field(() => Int)
  pointsA: number;

  @Field(() => Int)
  pointsB: number;

  @Field(() => String)
  scenarioId: string;

  @Field(() => String)
  revealSalt: string;

  @Field(() => Date)
  finalizedAt: Date;
}
