import { gql } from 'urql';

export const GET_NONCE = gql`
  query GetNonce($address: String!) {
    getNonce(address: $address) {
      nonce
      message
    }
  }
`;

export const VERIFY_SIGNATURE = gql`
  mutation VerifySignature($input: VerifySignatureInput!) {
    verifySignature(input: $input) {
      token
      user {
        id
        address
        createdAt
      }
    }
  }
`;

export const GET_ME = gql`
  query GetMe {
    me {
      id
      address
      createdAt
    }
  }
`;

export const GET_MY_STATS = gql`
  query GetMyStats {
    myStats {
      userId
      totalBattles
      wins
      losses
      draws
      winRate
      totalPoints
      weeklyPoints
    }
    myTotalPoints
  }
`;

export const GET_WEEKLY_POOL = gql`
  query GetWeeklyPool {
    weeklyPool {
      id
      weekStart
      totalFees
      distributedAt
    }
  }
`;

export const GET_LEADERBOARD = gql`
  query GetLeaderboard($take: Int) {
    leaderboard(take: $take) {
      rank
      userId
      totalPoints
    }
  }
`;
