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
        userId
        battleId
        points
        reason
        createdAt
      }
      hasMore
    }
  }
`;

// GET_LEADERBOARD and GET_WEEKLY_POOL are defined in auth.ts
