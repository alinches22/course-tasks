import { gql } from 'urql';

export const GET_SCENARIOS = gql`
  query GetScenarios {
    scenarios {
      id
      symbol
      asset
      timeframe
      tickIntervalMs
      tickCount
      metadata {
        name
        description
        difficulty
      }
      createdAt
    }
  }
`;

export const GET_SCENARIO = gql`
  query GetScenario($id: ID!) {
    scenario(id: $id) {
      id
      symbol
      asset
      timeframe
      tickIntervalMs
      tickCount
      metadata {
        name
        description
        difficulty
      }
      ticks {
        ts
        open
        high
        low
        close
        volume
      }
      createdAt
    }
  }
`;
