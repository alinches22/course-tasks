import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsEnum, IsInt, Min, Max, IsUUID } from 'class-validator';
import { BattleStatusEnum } from '../enums/battle-status.enum';

@InputType()
export class BattlesFilterInput {
  @Field(() => BattleStatusEnum, { nullable: true })
  @IsOptional()
  @IsEnum(BattleStatusEnum)
  status?: BattleStatusEnum;

  @Field(() => String, { nullable: true, description: 'Cursor for pagination' })
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @Field(() => Int, { nullable: true, description: 'Number of battles to return (default: 20)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;

  @Field(() => Boolean, { nullable: true, description: 'Only show battles user participated in' })
  @IsOptional()
  myBattles?: boolean;
}
