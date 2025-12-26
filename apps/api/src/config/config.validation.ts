import { plainToInstance, Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  API_PORT: number = 4000;

  @IsString()
  @IsOptional()
  API_HOST: string = '0.0.0.0';

  @IsString()
  DATABASE_URL: string;

  @IsString()
  REDIS_URL: string;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '7d';

  @IsString()
  @IsOptional()
  CORS_ORIGINS: string = 'http://localhost:3000';

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @Min(1)
  THROTTLE_TTL: number = 60;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @Min(1)
  THROTTLE_LIMIT: number = 100;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  BATTLE_TICK_INTERVAL_MS: number = 5000;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  BATTLE_COUNTDOWN_SECONDS: number = 10;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  BATTLE_MAX_DURATION_SECONDS: number = 300;
}

export function configValidation(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
