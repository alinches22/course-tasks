import { registerEnumType } from '@nestjs/graphql';

export enum BattleStatusEnum {
  WAITING = 'WAITING',
  MATCHED = 'MATCHED',
  RUNNING = 'RUNNING',
  FINISHED = 'FINISHED',
  CANCELED = 'CANCELED',
}

registerEnumType(BattleStatusEnum, {
  name: 'BattleStatus',
  description: 'Status of a battle',
});

export enum ActionTypeEnum {
  BUY = 'BUY',
  SELL = 'SELL',
}

registerEnumType(ActionTypeEnum, {
  name: 'ActionType',
  description: 'Type of trading action',
});

export enum ParticipantSideEnum {
  A = 'A',
  B = 'B',
}

registerEnumType(ParticipantSideEnum, {
  name: 'ParticipantSide',
  description: 'Side of a participant in a battle',
});
