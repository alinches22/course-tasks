import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { BattleStatusEnum } from '../enums/battle-status.enum';

@ObjectType()
export class BattleStateModel {
  @Field(() => ID)
  battleId: string;

  @Field(() => BattleStatusEnum)
  status: BattleStatusEnum;

  @Field(() => Int, { nullable: true })
  countdown?: number;

  @Field(() => String)
  message: string;
}
