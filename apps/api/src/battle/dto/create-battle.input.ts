import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';

@InputType()
export class CreateBattleInput {
  @Field(() => Number, { nullable: true, description: 'Starting balance (default: 10000)' })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(1000000)
  startingBalance?: number;
}
