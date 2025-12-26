import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '../config/config.service';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private subscriber: Redis;
  private publisher: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.redisUrl;

    this.client = new Redis(redisUrl);
    this.subscriber = new Redis(redisUrl);
    this.publisher = new Redis(redisUrl);

    this.client.on('error', (err) => console.error('Redis Client Error:', err));
    this.subscriber.on('error', (err) => console.error('Redis Subscriber Error:', err));
    this.publisher.on('error', (err) => console.error('Redis Publisher Error:', err));

    console.log('Redis connected');
  }

  async onModuleDestroy() {
    await this.client?.quit();
    await this.subscriber?.quit();
    await this.publisher?.quit();
  }

  getClient(): Redis {
    return this.client;
  }

  getSubscriber(): Redis {
    return this.subscriber;
  }

  getPublisher(): Redis {
    return this.publisher;
  }

  // Key-value operations
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  // Action cooldown tracking
  async checkActionCooldown(battleId: string, userId: string): Promise<boolean> {
    const key = `action_cooldown:${battleId}:${userId}`;
    const exists = await this.exists(key);
    return !exists;
  }

  async setActionCooldown(battleId: string, userId: string, cooldownMs: number): Promise<void> {
    const key = `action_cooldown:${battleId}:${userId}`;
    await this.set(key, '1', Math.ceil(cooldownMs / 1000));
  }

  // Rate limiting: max actions per second per user
  async checkRateLimit(userId: string, maxPerSecond: number = 3): Promise<boolean> {
    const key = `rate_limit:${userId}`;
    const current = await this.client.incr(key);
    
    if (current === 1) {
      // First request in this window, set expiry
      await this.client.expire(key, 1);
    }
    
    return current <= maxPerSecond;
  }

  // Duplicate action detection (same tick, same action type)
  async checkDuplicateAction(
    battleId: string,
    oderId: string,
    tickIndex: number,
    actionType: string,
  ): Promise<boolean> {
    const key = `dup_action:${battleId}:${oderId}:${tickIndex}:${actionType}`;
    const exists = await this.exists(key);
    
    if (!exists) {
      // Mark this action as seen (5 seconds TTL, more than enough)
      await this.set(key, '1', 5);
      return false; // Not a duplicate
    }
    
    return true; // Is a duplicate
  }

  // Store last known tick for reconnection
  async setLastTick(battleId: string, tickIndex: number, tickData: object): Promise<void> {
    const key = `last_tick:${battleId}`;
    await this.set(key, JSON.stringify({ tickIndex, tick: tickData }), 300);
  }

  async getLastTick(battleId: string): Promise<{ tickIndex: number; tick: any } | null> {
    const data = await this.get(`last_tick:${battleId}`);
    return data ? JSON.parse(data) : null;
  }

  // Store recent ticks window for reconnection (last N ticks)
  async addToTickWindow(battleId: string, tickData: object, maxWindow: number = 10): Promise<void> {
    const key = `tick_window:${battleId}`;
    await this.client.lpush(key, JSON.stringify(tickData));
    await this.client.ltrim(key, 0, maxWindow - 1);
    await this.client.expire(key, 300);
  }

  async getTickWindow(battleId: string): Promise<any[]> {
    const key = `tick_window:${battleId}`;
    const data = await this.client.lrange(key, 0, -1);
    return data.map((d) => JSON.parse(d)).reverse(); // Oldest first
  }

  // Battle state caching
  async getBattleState(battleId: string): Promise<string | null> {
    return this.get(`battle_state:${battleId}`);
  }

  async setBattleState(battleId: string, state: object): Promise<void> {
    await this.set(`battle_state:${battleId}`, JSON.stringify(state), 3600);
  }

  async deleteBattleState(battleId: string): Promise<void> {
    await this.del(`battle_state:${battleId}`);
  }

  // PubSub for real-time events
  async publish(channel: string, message: object): Promise<void> {
    await this.publisher.publish(channel, JSON.stringify(message));
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', (ch, message) => {
      if (ch === channel) {
        callback(message);
      }
    });
  }
}
