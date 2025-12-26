import { gql } from 'urql';

export const BATTLE_TICK_SUBSCRIPTION = gql`
  subscription BattleTick($battleId: ID!) {
    battleTick(battleId: $battleId) {
      battleId
      tick {
        ts
        open
        high
        low
        close
        volume
      }
      currentIndex
      totalTicks
      timeRemaining
    }
  }
`;

export const BATTLE_STATE_SUBSCRIPTION = gql`
  subscription BattleState($battleId: ID!) {
    battleState(battleId: $battleId) {
      battleId
      status
      countdown
      message
    }
  }
`;

export const BATTLE_RESULT_SUBSCRIPTION = gql`
  subscription BattleResult($battleId: ID!) {
    battleResult(battleId: $battleId) {
      battleId
      winner {
        id
        address
      }
      isDraw
      pnlA
      pnlB
      pointsA
      pointsB
      scenarioId
      revealSalt
      finalizedAt
    }
  }
`;
