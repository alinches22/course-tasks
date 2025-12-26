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
