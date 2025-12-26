import { InputType, Field, ID } from '@nestjs/graphql';
import { IsOptional, IsNumber, Min, Max, IsUUID } from 'class-validator';

@InputType()
export class CreateBattleInput {
  @Field(() => ID, { nullable: true, description: 'Scenario ID (optional - random if not provided)' })
  @IsOptional()
  @IsUUID()
  scenarioId?: string;

  @Field(() => Number, { nullable: true, description: 'Starting balance (default: 10000)' })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(1000000)
  startingBalance?: number;
}
