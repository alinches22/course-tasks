import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { ActionTypeEnum } from '../../battle/enums/battle-status.enum';

@ObjectType()
export class ActionModel {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  battleId: string;

  @Field(() => ID)
  userId: string;

  @Field(() => ActionTypeEnum)
  type: ActionTypeEnum;

  @Field(() => Number)
  quantity: number;

  @Field(() => Number)
  price: number;

  @Field(() => Int)
  tickIndex: number;

  @Field(() => Date)
  serverTs: Date;
}
