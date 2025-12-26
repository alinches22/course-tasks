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
  }
`;
