import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get port(): number {
    return this.configService.get<number>('API_PORT', 4000);
  }

  get host(): string {
    return this.configService.get<string>('API_HOST', '0.0.0.0');
  }

  get databaseUrl(): string {
    return this.configService.getOrThrow<string>('DATABASE_URL');
  }

  get redisUrl(): string {
    return this.configService.getOrThrow<string>('REDIS_URL');
  }

  get jwtSecret(): string {
    return this.configService.getOrThrow<string>('JWT_SECRET');
  }

  get jwtExpiresIn(): string {
    return this.configService.get<string>('JWT_EXPIRES_IN', '7d');
  }

  get corsOrigins(): string[] {
    const origins = this.configService.get<string>('CORS_ORIGINS', 'http://localhost:3000');
    return origins.split(',').map((o) => o.trim());
  }

  // Throttling
  get throttleTtl(): number {
    return this.configService.get<number>('THROTTLE_TTL', 60);
  }

  get throttleLimit(): number {
    return this.configService.get<number>('THROTTLE_LIMIT', 100);
  }

  // Battle configuration
  get battleTickIntervalMs(): number {
    return this.configService.get<number>('BATTLE_TICK_INTERVAL_MS', 5000);
  }

  get battleCountdownSeconds(): number {
    return this.configService.get<number>('BATTLE_COUNTDOWN_SECONDS', 10);
  }

  get battleMaxDurationSeconds(): number {
    return this.configService.get<number>('BATTLE_MAX_DURATION_SECONDS', 300);
  }

  // Points configuration
  get weeklyPoolPercent(): number {
    return this.configService.get<number>('WEEKLY_POOL_PERCENT', 10);
  }

  get teamFeePercent(): number {
    return this.configService.get<number>('TEAM_FEE_PERCENT', 5);
  }

  // Auth configuration
  get nonceExpiryMs(): number {
    return this.configService.get<number>('NONCE_EXPIRY_MS', 5 * 60 * 1000);
  }

  // Action cooldown
  get actionCooldownMs(): number {
    return this.configService.get<number>('ACTION_COOLDOWN_MS', 1000);
  }
}
