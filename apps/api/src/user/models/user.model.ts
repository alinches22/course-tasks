import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class UserModel {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  address: string;

  @Field(() => Date)
  createdAt: Date;
}

@ObjectType()
export class UserStatsModel {
  @Field(() => ID)
  userId: string;

  @Field(() => Int)
  totalBattles: number;

  @Field(() => Int)
  wins: number;

  @Field(() => Int)
  losses: number;

  @Field(() => Int)
  draws: number;

  @Field(() => Float)
  winRate: number;

  @Field(() => Int)
  totalPoints: number;

  @Field(() => Int)
  weeklyPoints: number;
}
