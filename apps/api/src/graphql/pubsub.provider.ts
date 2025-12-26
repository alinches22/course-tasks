import { Provider } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';

export const PUB_SUB = 'PUB_SUB';

// In production, use Redis PubSub for horizontal scaling
// For MVP, in-memory PubSub is sufficient
const pubSub = new PubSub();

export const PubSubProvider: Provider = {
  provide: PUB_SUB,
  useValue: pubSub,
};

// Subscription event names
export const BATTLE_TICK = 'battleTick';
export const BATTLE_STATE = 'battleState';
export const BATTLE_RESULT = 'battleResult';
