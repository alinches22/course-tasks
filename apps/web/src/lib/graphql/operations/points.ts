import { gql } from 'urql';

export const GET_MY_TOTAL_POINTS = gql`
  query GetMyTotalPoints {
    myTotalPoints
  }
`;

export const GET_MY_POINTS_HISTORY = gql`
  query GetMyPointsHistory($take: Int, $cursor: String) {
    myPointsHistory(take: $take, cursor: $cursor) {
      entries {
        id
        oderId
        battleId
        points
        reason
        createdAt
      }
      hasMore
    }
  }
`;

export const GET_LEADERBOARD = gql`
  query GetLeaderboard($take: Int) {
    leaderboard(take: $take) {
      rank
      oderId
      totalPoints
    }
  }
`;

export const GET_WEEKLY_POOL = gql`
  query GetWeeklyPool {
    currentWeeklyPool {
      id
      weekStart
      totalFees
      distributedAt
    }
  }
`;
