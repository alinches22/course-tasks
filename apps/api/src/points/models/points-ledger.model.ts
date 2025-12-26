import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class PointsLedgerModel {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => ID, { nullable: true })
  battleId?: string;

  @Field(() => Int)
  points: number;

  @Field(() => String)
  reason: string;

  @Field(() => Date)
  createdAt: Date;
}

@ObjectType()
export class PointsHistoryModel {
  @Field(() => [PointsLedgerModel])
  entries: PointsLedgerModel[];

  @Field(() => Boolean)
  hasMore: boolean;
}

@ObjectType()
export class WeeklyPoolModel {
  @Field(() => ID)
  id: string;

  @Field(() => Date)
  weekStart: Date;

  @Field(() => Number)
  totalFees: number;

  @Field(() => Date, { nullable: true })
  distributedAt?: Date;
}

@ObjectType()
export class LeaderboardEntryModel {
  @Field(() => Int)
  rank: number;

  @Field(() => ID)
  userId: string;

  @Field(() => Int)
  totalPoints: number;
}
