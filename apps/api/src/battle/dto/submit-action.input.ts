import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsEnum, IsNumber, Min } from 'class-validator';
import { ActionTypeEnum } from '../enums/battle-status.enum';

@InputType()
export class SubmitActionInput {
  @Field(() => ID, { description: 'Battle ID' })
  @IsUUID()
  battleId: string;

  @Field(() => ActionTypeEnum, { description: 'Action type (BUY or SELL)' })
  @IsEnum(ActionTypeEnum)
  type: ActionTypeEnum;

  @Field(() => Number, { description: 'Quantity to trade' })
  @IsNumber()
  @Min(0.0001)
  quantity: number;
}
