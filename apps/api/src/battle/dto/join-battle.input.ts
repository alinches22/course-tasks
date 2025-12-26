import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class JoinBattleInput {
  @Field(() => ID, { description: 'Battle ID to join' })
  @IsUUID()
  battleId: string;
}
