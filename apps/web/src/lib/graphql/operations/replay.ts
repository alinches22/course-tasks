import { gql } from 'urql';

export const GET_REPLAY = gql`
  query GetReplay($battleId: ID!) {
    replay(battleId: $battleId) {
      battleId
      asset
      timeframe
      ticks {
        ts
        open
        high
        low
        close
        volume
      }
      actions {
        userId
        type
        quantity
        price
        tickIndex
        serverTs
      }
      participants {
        userId
        address
        side
        startingBalance
        finalPnl
      }
      result {
        winnerId
        isDraw
        pnlA
        pnlB
        finalizedAt
      }
      verification {
        scenarioId
        revealSalt
        commitHash
        isValid
      }
    }
  }
`;
