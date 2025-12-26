import { gql } from 'urql';

export const GET_BATTLES = gql`
  query GetBattles($filter: BattlesFilterInput) {
    battles(filter: $filter) {
      battles {
        id
        status
        commitHash
        asset
        timeframe
        stakeAmount
        feeBps
        participants {
          id
          side
          user {
            id
            address
          }
          startingBalance
          currentBalance
        }
        createdAt
        matchedAt
        startedAt
        finishedAt
      }
      nextCursor
      hasMore
    }
  }
`;

export const GET_BATTLE = gql`
  query GetBattle($id: ID!) {
    battle(id: $id) {
      id
      status
      commitHash
      revealSalt
      scenarioId
      asset
      timeframe
      participants {
        id
        side
        user {
          id
          address
        }
        startingBalance
        currentBalance
      }
      createdAt
      matchedAt
      startedAt
      finishedAt
    }
  }
`;

export const CREATE_BATTLE = gql`
  mutation CreateBattle($input: CreateBattleInput) {
    createBattle(input: $input) {
      id
      status
      commitHash
      asset
      timeframe
      participants {
        id
        side
        user {
          id
          address
        }
      }
      createdAt
    }
  }
`;

export const JOIN_BATTLE = gql`
  mutation JoinBattle($input: JoinBattleInput!) {
    joinBattle(input: $input) {
      id
      status
      participants {
        id
        side
        user {
          id
          address
        }
      }
      matchedAt
    }
  }
`;

export const SUBMIT_ACTION = gql`
  mutation SubmitAction($input: SubmitActionInput!) {
    submitAction(input: $input)
  }
`;

export const CANCEL_BATTLE = gql`
  mutation CancelBattle($id: ID!) {
    cancelBattle(id: $id) {
      id
      status
    }
  }
`;

// Action types for battle
export type ActionType = 'BUY' | 'SELL' | 'CLOSE';
